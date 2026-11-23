import sys
from pathlib import Path
from datetime import datetime, date

# Ensure root is in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.prompt import Prompt, Confirm, IntPrompt, FloatPrompt
from rich import print as rprint

from backend.app.database import SessionLocal, engine, Base
from backend.app.models.donor import Donor
from backend.app.models.camp import DonationCamp
from backend.app.schemas.donor import DonorCreate, DonorUpdate
from backend.app.schemas.camp import CampCreate
from backend.app.services.donor_service import (
    register_donor,
    get_donors,
    get_donor_by_id,
    update_donor,
    soft_delete_donor
)
from backend.app.services.camp_service import (
    create_camp,
    get_camps,
    get_camp_by_id,
    delete_camp
)
from backend.app.services.analytics_service import (
    compute_blood_group_analytics,
    compute_dashboard_summary
)
from backend.app.services.import_export_service import (
    parse_and_validate_csv,
    execute_csv_import,
    export_donors_csv,
    export_report_markdown,
    generate_pdf_report
)
from backend.app.services.backup_service import create_json_backup
from backend.app.config import ALLOWED_BLOOD_GROUPS, EXPORTS_DIR

console = Console()

def print_banner():
    console.clear()
    banner = """
[bold red]██╗     ██╗███████╗███████╗██████╗  ██████╗ ██╗███╗   ██╗████████╗[/bold red]
[bold red]██║     ██║██╔════╝██╔════╝██╔══██╗██╔═══██╗██║████╗  ██║╚══██╔══╝[/bold red]
[bold white]██║     ██║█████╗  █████╗  ██████╔╝██║   ██║██║██╔██╗ ██║   ██║   [/bold white]
[bold white]██║     ██║██╔══╝  ██╔══╝  ██╔═══╝ ██║   ██║██║██║╚██╗██║   ██║   [/bold white]
[bold dark_red]███████╗██║██║     ███████╗██║     ╚██████╔╝██║██║ ╚████║   ██║   [/bold dark_red]
[bold dark_red]╚══════╝╚═╝╚═╝     ╚══════╝╚═╝      ╚═════╝ ╚═╝╚═╝  ╚═══╝   ╚═╝   [/bold dark_red]
[cyan]Blood Donation Camp Register & Local Management Platform[/cyan]
[dim]Local-First Architecture • SQLite Persistence • Production Edition[/dim]
"""
    console.print(banner)

def register_donor_cli(db):
    console.print(Panel("[bold green]Register New Volunteer Donor[/bold green]", expand=False))
    
    full_name = Prompt.ask("[bold]Full Name[/bold]").strip()
    if not full_name:
        console.print("[red]Name cannot be empty![/red]")
        return

    dob_str = Prompt.ask("[bold]Date of Birth (YYYY-MM-DD)[/bold]").strip()
    try:
        dob = datetime.strptime(dob_str, "%Y-%m-%d").date()
        if dob > date.today():
            console.print("[red]Date of birth cannot be in the future![/red]")
            return
    except ValueError:
        console.print("[red]Invalid date format! Use YYYY-MM-DD.[/red]")
        return

    phone = Prompt.ask("[bold]Phone Number (min 10 digits)[/bold]").strip()
    email = Prompt.ask("[bold]Email Address (optional)[/bold]", default="").strip() or None
    gender = Prompt.ask("[bold]Gender (Male/Female/Other)[/bold]", choices=["Male", "Female", "Other", "Prefer not to say"], default="Male")

    console.print(f"[dim]Available Blood Groups: {', '.join(ALLOWED_BLOOD_GROUPS)}[/dim]")
    blood_group = Prompt.ask("[bold]Blood Group[/bold]", choices=ALLOWED_BLOOD_GROUPS).upper()
    weight = FloatPrompt.ask("[bold]Weight (kg)[/bold]", default=65.0)

    address = Prompt.ask("[bold]Address[/bold]").strip()
    city = Prompt.ask("[bold]City[/bold]").strip()
    state = Prompt.ask("[bold]State[/bold]").strip()
    pin_code = Prompt.ask("[bold]PIN Code[/bold]").strip()

    has_chronic = Confirm.ask("Do you have any chronic medical conditions?", default=False)
    has_surgery = Confirm.ask("Have you had major surgery in the past 6 months?", default=False)
    has_meds = Confirm.ask("Are you currently taking any prescription medications?", default=False)

    try:
        donor_in = DonorCreate(
            full_name=full_name,
            date_of_birth=dob,
            gender=gender,
            phone=phone,
            email=email,
            address=address,
            city=city,
            state=state,
            pin_code=pin_code,
            blood_group=blood_group,
            weight_kg=weight,
            has_chronic_illness=has_chronic,
            has_recent_surgery=has_surgery,
            has_medication=has_meds,
            consent_data_storage=True,
            consent_contact=True
        )
        donor = register_donor(db, donor_in)
        console.print(Panel(
            f"[bold green]✓ Donor Successfully Registered![/bold green]\n\n"
            f"[bold]Donor ID:[/bold] [yellow]{donor.donor_id}[/yellow]\n"
            f"[bold]Name:[/bold] {donor.full_name}\n"
            f"[bold]Blood Group:[/bold] [red]{donor.blood_group}[/red]\n"
            f"[bold]Calculated Age:[/bold] {donor.age} years\n"
            f"[bold]Preliminary Status:[/bold] {donor.screening_status}"
            + (f"\n[bold yellow]Note:[/bold yellow] {donor.deferral_reason}" if donor.deferral_reason else ""),
            title="Registration Receipt",
            border_style="green"
        ))
    except Exception as e:
        console.print(f"[bold red]Registration Failed:[/bold red] {str(e)}")

def view_donors_cli(db):
    page = 1
    page_size = 10
    while True:
        donors, total = get_donors(db, page=page, page_size=page_size)
        total_pages = (total + page_size - 1) // page_size if total > 0 else 1

        table = Table(title=f"Registered Donors (Page {page} of {total_pages} - Total {total})")
        table.add_column("Donor ID", style="cyan", no_wrap=True)
        table.add_column("Name", style="bold")
        table.add_column("Blood Group", style="red")
        table.add_column("Age", justify="center")
        table.add_column("Phone", style="dim")
        table.add_column("City", style="green")
        table.add_column("Status", style="yellow")
        table.add_column("Donations", justify="center")

        for d in donors:
            status_style = "green" if "ELIGIBLE" in d.screening_status else "red"
            table.add_row(
                d.donor_id,
                d.full_name,
                d.blood_group,
                str(d.age),
                d.phone,
                d.city,
                f"[{status_style}]{d.screening_status}[/{status_style}]",
                str(d.total_donations)
            )

        console.print(table)
        console.print("[dim]Options: [N]ext Page | [P]revious Page | [V]iew Profile | [Q]uit to Menu[/dim]")
        choice = Prompt.ask("Action", choices=["n", "p", "v", "q"], default="q").lower()
        if choice == "n" and page < total_pages:
            page += 1
        elif choice == "p" and page > 1:
            page -= 1
        elif choice == "v":
            did = Prompt.ask("Enter Donor ID (e.g. LP-2026-0001)")
            view_donor_profile_cli(db, did)
        elif choice == "q":
            break

def view_donor_profile_cli(db, donor_id):
    donor = get_donor_by_id(db, donor_id)
    if not donor:
        console.print(f"[red]Donor '{donor_id}' not found![/red]")
        return

    content = f"""
[bold cyan]Donor ID:[/bold cyan] {donor.donor_id}
[bold]Full Name:[/bold] {donor.full_name}
[bold]Blood Group:[/bold] [bold red]{donor.blood_group}[/bold red]
[bold]Date of Birth:[/bold] {donor.date_of_birth} (Age: {donor.age})
[bold]Gender:[/bold] {donor.gender or 'N/A'}
[bold]Phone:[/bold] {donor.phone}
[bold]Email:[/bold] {donor.email or 'N/A'}
[bold]Location:[/bold] {donor.address}, {donor.city}, {donor.state} - {donor.pin_code}
[bold]Weight:[/bold] {donor.weight_kg} kg
[bold]Total Donations:[/bold] {donor.total_donations}
[bold]Last Donation Date:[/bold] {donor.last_donation_date or 'None recorded'}
[bold]Screening Status:[/bold] [yellow]{donor.screening_status}[/yellow]
[bold]Deferral Reason:[/bold] {donor.deferral_reason or 'None'}
[bold]Registration Date:[/bold] {donor.registration_date.strftime('%Y-%m-%d %H:%M')}
"""
    console.print(Panel(content.strip(), title=f"Profile: {donor.full_name}", border_style="red"))

def search_donor_cli(db):
    term = Prompt.ask("[bold]Enter Name, Phone, Donor ID, or City to search[/bold]").strip()
    if not term:
        return
    donors, total = get_donors(db, search=term, page=1, page_size=25)
    if not donors:
        console.print(f"[yellow]No matching donors found for '{term}'[/yellow]")
        return

    table = Table(title=f"Search Results for '{term}' ({total} found)")
    table.add_column("Donor ID", style="cyan")
    table.add_column("Name", style="bold")
    table.add_column("Blood Group", style="red")
    table.add_column("Phone")
    table.add_column("City")
    table.add_column("Status")

    for d in donors:
        table.add_row(d.donor_id, d.full_name, d.blood_group, d.phone, d.city, d.screening_status)
    console.print(table)

def blood_group_count_cli(db):
    analytics = compute_blood_group_analytics(db)
    
    table = Table(title="[bold red]Blood Group Inventory & Distribution Analysis[/bold red]")
    table.add_column("Blood Group", style="bold red", justify="center")
    table.add_column("Total Donors", justify="center")
    table.add_column("Eligible", justify="center", style="green")
    table.add_column("Temp Deferred", justify="center", style="yellow")
    table.add_column("Perm Deferred", justify="center", style="red")
    table.add_column("Donations", justify="center")
    table.add_column("Percentage", justify="right")

    for bg in analytics.blood_groups:
        table.add_row(
            bg.blood_group,
            str(bg.total_donors),
            str(bg.eligible_donors),
            str(bg.temporarily_deferred),
            str(bg.permanently_deferred),
            str(bg.completed_donations),
            f"{bg.percentage}%"
        )
    console.print(table)

    summary_text = (
        f"[bold]Total Registered Donors:[/bold] {analytics.total_registered}\n"
        f"[bold]Most Common Blood Group:[/bold] [red]{analytics.most_common_blood_group}[/red] ({analytics.most_common_count} donors)\n"
        f"[bold]Least Common Blood Group:[/bold] [cyan]{analytics.least_common_blood_group}[/cyan] ({analytics.least_common_count} donors)"
    )
    console.print(Panel(summary_text, title="Distribution Summary", border_style="red"))

def executive_summary_cli(db):
    summary = compute_dashboard_summary(db)
    panel_content = f"""
[bold cyan]LIFEPOINT EXECUTIVE DASHBOARD SUMMARY[/bold cyan]
------------------------------------------------------------
[bold]Total Registered Volunteers:[/bold]   {summary.total_volunteers}
[bold green]Medically Eligible Donors:[/bold green]     {summary.eligible_donors}
[bold yellow]Temporarily Deferred:[/bold yellow]          {summary.temporarily_deferred}
[bold red]Permanently Deferred:[/bold red]          {summary.permanently_deferred}
[bold]Completed Blood Donations:[/bold]     {summary.completed_donations}
[bold]Active Donation Camps:[/bold]         {summary.active_camps}
[bold]Upcoming Donation Camps:[/bold]       {summary.upcoming_camps}
[bold]New Volunteers This Month:[/bold]     {summary.new_registrations_this_month}
[bold]Most Common Blood Group:[/bold]       [red]{summary.most_common_blood_group}[/red]
------------------------------------------------------------
"""
    console.print(Panel(panel_content.strip(), border_style="green", expand=False))

def camp_management_cli(db):
    while True:
        camps = get_camps(db)
        table = Table(title="Donation Camps")
        table.add_column("Code", style="cyan")
        table.add_column("Name", style="bold")
        table.add_column("City")
        table.add_column("Dates")
        table.add_column("Capacity")
        table.add_column("Status")

        for c, d_count, don_count in camps:
            status_style = "green" if c.status == "ACTIVE" else "yellow" if c.status == "UPCOMING" else "dim"
            table.add_row(
                c.camp_code,
                c.name,
                c.city,
                f"{c.start_date} to {c.end_date}",
                f"{d_count}/{c.capacity}",
                f"[{status_style}]{c.status}[/{status_style}]"
            )
        console.print(table)
        console.print("[dim]Options: [C]reate Camp | [D]elete Camp | [B]ack to Main Menu[/dim]")
        choice = Prompt.ask("Action", choices=["c", "d", "b"], default="b").lower()
        if choice == "c":
            name = Prompt.ask("Camp Name")
            venue = Prompt.ask("Venue")
            city = Prompt.ask("City")
            addr = Prompt.ask("Address")
            start = Prompt.ask("Start Date (YYYY-MM-DD)")
            end = Prompt.ask("End Date (YYYY-MM-DD)")
            org = Prompt.ask("Organizer")
            phone = Prompt.ask("Contact Phone")
            cap = IntPrompt.ask("Capacity", default=100)
            try:
                c_in = CampCreate(
                    name=name, venue=venue, city=city, address=addr,
                    start_date=datetime.strptime(start, "%Y-%m-%d").date(),
                    end_date=datetime.strptime(end, "%Y-%m-%d").date(),
                    organizer=org, contact_phone=phone, capacity=cap
                )
                created = create_camp(db, c_in)
                console.print(f"[green]✓ Camp created: {created.camp_code} ({created.name})[/green]")
            except Exception as e:
                console.print(f"[red]Error creating camp: {e}[/red]")
        elif choice == "d":
            code = Prompt.ask("Enter Camp Code to delete")
            if Confirm.ask(f"Are you sure you want to delete camp {code}?"):
                try:
                    delete_camp(db, code)
                    console.print(f"[green]Camp {code} deleted successfully.[/green]")
                except Exception as e:
                    console.print(f"[red]Error: {e}[/red]")
        elif choice == "b":
            break

def csv_import_cli(db):
    console.print(Panel("[bold]Bulk CSV Import[/bold]", expand=False))
    file_path_str = Prompt.ask("Enter CSV file path (e.g. sample_data/sample_donors.csv)")
    p = Path(file_path_str)
    if not p.exists():
        console.print(f"[red]File '{file_path_str}' not found![/red]")
        return
    try:
        with open(p, "r", encoding="utf-8") as f:
            content = f.read()
        res = parse_and_validate_csv(db, content)
        if not res["success"]:
            console.print(f"[red]CSV Validation Error:[/red] {res.get('error')}")
            return
        console.print(f"[green]✓ Found {res['valid_count']} valid rows, {res['invalid_count']} invalid rows.[/green]")
        if res["invalid_count"] > 0:
            console.print(f"[yellow]Warning: {res['invalid_count']} rows contain validation errors and will be skipped.[/yellow]")
        if res["valid_count"] > 0 and Confirm.ask(f"Import {res['valid_count']} valid donor records now?"):
            imported = execute_csv_import(db, res["valid_rows"])
            console.print(f"[bold green]✓ Successfully imported {imported} donor records into SQLite![/bold green]")
    except Exception as e:
        console.print(f"[red]Import failed:[/red] {e}")

def export_reports_cli(db):
    console.print(Panel("[bold]Generate & Export Reports[/bold]", expand=False))
    console.print("1. Export Donors to CSV\n2. Export Executive Report to Markdown\n3. Export Executive Report to PDF")
    choice = Prompt.ask("Select export format", choices=["1", "2", "3"])
    EXPORTS_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")

    if choice == "1":
        csv_data = export_donors_csv(db)
        out = EXPORTS_DIR / f"donors_export_{ts}.csv"
        with open(out, "w", encoding="utf-8") as f:
            f.write(csv_data)
        console.print(f"[bold green]✓ CSV report saved to:[/bold green] {out}")
    elif choice == "2":
        md_data = export_report_markdown(db)
        out = EXPORTS_DIR / f"lifepoint_report_{ts}.md"
        with open(out, "w", encoding="utf-8") as f:
            f.write(md_data)
        console.print(f"[bold green]✓ Markdown report saved to:[/bold green] {out}")
    elif choice == "3":
        pdf_bytes = generate_pdf_report(db)
        out = EXPORTS_DIR / f"lifepoint_report_{ts}.pdf"
        with open(out, "wb") as f:
            f.write(pdf_bytes)
        console.print(f"[bold green]✓ Styled PDF report saved to:[/bold green] {out}")

def database_backup_cli(db):
    res = create_json_backup(db)
    console.print(Panel(
        f"[bold green]✓ Database Backup Created Successfully![/bold green]\n\n"
        f"[bold]Filename:[/bold] {res['filename']}\n"
        f"[bold]Path:[/bold] {res['file_path']}\n"
        f"[bold]Donors Preserved:[/bold] {res['metadata']['donor_count']}\n"
        f"[bold]Camps Preserved:[/bold] {res['metadata']['camp_count']}",
        title="Backup Confirmation",
        border_style="green"
    ))

def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        while True:
            print_banner()
            menu = """
[bold yellow]MAIN MENU[/bold yellow]
 [bold cyan]1.[/bold cyan] Register Donor                [bold cyan]7.[/bold cyan] Executive Summary
 [bold cyan]2.[/bold cyan] View All Donors               [bold cyan]8.[/bold cyan] Camp Management
 [bold cyan]3.[/bold cyan] Search Donor                  [bold cyan]9.[/bold cyan] Bulk CSV Import
 [bold cyan]4.[/bold cyan] Update Donor Profile          [bold cyan]10.[/bold cyan] Export Reports (CSV/MD/PDF)
 [bold cyan]5.[/bold cyan] Delete Donor Record           [bold cyan]11.[/bold cyan] Database Backup (JSON)
 [bold cyan]6.[/bold cyan] Blood Group Count & Analytics [bold cyan]12.[/bold cyan] [bold red]Exit[/bold red]
"""
            console.print(menu)
            choice = Prompt.ask("[bold green]Select Option (1-12)[/bold green]", choices=[str(i) for i in range(1, 13)], default="7")

            if choice == "1":
                register_donor_cli(db)
            elif choice == "2":
                view_donors_cli(db)
            elif choice == "3":
                search_donor_cli(db)
            elif choice == "4":
                did = Prompt.ask("Enter Donor ID to update")
                donor = get_donor_by_id(db, did)
                if not donor:
                    console.print("[red]Donor not found[/red]")
                else:
                    new_city = Prompt.ask("New City (leave blank to keep current)", default=donor.city)
                    new_phone = Prompt.ask("New Phone (leave blank to keep current)", default=donor.phone)
                    new_status = Prompt.ask(
                        "Update Screening Status",
                        choices=["PRELIMINARY_ELIGIBLE", "VERIFIED_ELIGIBLE", "TEMPORARILY_DEFERRED", "PERMANENTLY_DEFERRED"],
                        default=donor.screening_status
                    )
                    update_donor(db, did, DonorUpdate(city=new_city, phone=new_phone, screening_status=new_status))
                    console.print("[green]Donor updated successfully![/green]")
            elif choice == "5":
                did = Prompt.ask("Enter Donor ID to delete")
                if Confirm.ask(f"Confirm deactivation of donor {did}?"):
                    try:
                        soft_delete_donor(db, did)
                        console.print(f"[green]Donor {did} deactivated.[/green]")
                    except Exception as e:
                        console.print(f"[red]Error: {e}[/red]")
            elif choice == "6":
                blood_group_count_cli(db)
            elif choice == "7":
                executive_summary_cli(db)
            elif choice == "8":
                camp_management_cli(db)
            elif choice == "9":
                csv_import_cli(db)
            elif choice == "10":
                export_reports_cli(db)
            elif choice == "11":
                database_backup_cli(db)
            elif choice == "12":
                console.print("[bold cyan]Exiting LIFEPOINT CLI. Have a great day![/bold cyan]")
                break

            Prompt.ask("\n[dim]Press Enter to return to main menu...[/dim]", default="")
    finally:
        db.close()

if __name__ == "__main__":
    main()
