import {
  Radar,
  KeyRound,
  Fingerprint,
  Shield,
  Globe,
  Lock,
} from "lucide-react";

export interface Screenshot {
  src: string;
  caption: string;
}

export interface EvalStep {
  id: number;
  title: string;
  date: string;
  content: string;
  category: string;
  icon: React.ElementType;
  relatedIds: number[];
  status: "completed" | "in-progress" | "pending";
  energy: number;
  points: string;
  pointsMax: number;
  pointsObtained: number;
  commands: string[];
  screenshots: Screenshot[];
  details: string[];
  findings: string[];
}

export const evalSteps: EvalStep[] = [
  {
    id: 1,
    title: "Reconnaissance",
    date: "Nmap",
    content: "Scan de decouverte reseau et enumeration des ports/services de la cible.",
    category: "Recon",
    icon: Radar,
    relatedIds: [2],
    status: "completed",
    energy: 100,
    points: "/3",
    pointsMax: 3,
    pointsObtained: 3,
    commands: [
      "sudo nmap -sn 10.0.2.0/24",
      "sudo nmap -sV 10.0.2.9",
    ],
    screenshots: [
      { src: "screenshots/Decouverte_reseau_pour_identifier_la_cible.png", caption: "Scan de decouverte reseau — identification de la cible 10.0.2.9" },
      { src: "screenshots/scan_ip_cible.png", caption: "Scan de ports — FTP (21) et SSH (22) ouverts" },
    ],
    details: [
      "Utilisation de CyberKit Module 1 pour effectuer un scan de decouverte sur le subnet 10.0.2.0/24",
      "5 hotes detectes, cible identifiee a 10.0.2.9 (Oracle VirtualBox NIC)",
      "Scan de services : port 21/tcp FTP (vsftpd 3.0.3) et port 22/tcp SSH (OpenSSH 9.2p1)",
    ],
    findings: [
      "IP cible : 10.0.2.9",
      "Port 21 — FTP (vsftpd 3.0.3)",
      "Port 22 — SSH (OpenSSH 9.2p1 Debian)",
    ],
  },
  {
    id: 2,
    title: "Brute Force",
    date: "CUPP + Hydra + Hashcat",
    content: "Generation de wordlist OSINT, brute force SSH/FTP et crack du KeePass.",
    category: "Exploitation",
    icon: KeyRound,
    relatedIds: [1, 3],
    status: "completed",
    energy: 100,
    points: "/4",
    pointsMax: 4,
    pointsObtained: 4,
    commands: [
      "python3 cupp.py -i",
      "hydra -l raptor -P ismail.txt ssh://10.0.2.9 -t 16",
      "hydra -l raptor -P ismail.txt ftp://10.0.2.9 -t 16",
      "keepass2john KEEPASS_EVAL_V2.kdb > keepass_hash.txt",
      "sed -i 's/^KEEPASS_EVAL_V2.kdb://' keepass_hash.txt",
      "hashcat -m 13400 -a 0 keepass_hash.txt /usr/share/wordlists/nmap.lst --force",
    ],
    screenshots: [
      { src: "screenshots/infos_raptor_cupp.png", caption: "Profiling OSINT avec CUPP — informations sur Raptor Dissident" },
      { src: "screenshots/wordlist_Ismail_généré.png", caption: "Wordlist generee : 5525 mots de passe" },
      { src: "screenshots/Lancement_du_brute_force_ssh.png", caption: "Lancement du brute force SSH avec Hydra" },
      { src: "screenshots/resultat_bruteforce_ssh.png", caption: "Mot de passe SSH trouve : Tampo2020" },
      { src: "screenshots/Lancement_brute_force_ftp.png", caption: "Brute force FTP lance en parallele" },
      { src: "screenshots/connexion_ssh_keepass.png", caption: "Connexion SSH et localisation du fichier KeePass" },
      { src: "screenshots/Recuperation_du_keepass_sur_kali.png", caption: "Transfert du KeePass sur la Kali via SCP" },
      { src: "screenshots/lancement_brute_force_keepass.png", caption: "Lancement Hashcat sur le hash KeePass" },
      { src: "screenshots/mdp_trouve_dans_keepass.png", caption: "KeePass cracke en 9 secondes : chicken" },
      { src: "screenshots/ids_found_inside_kdb_file.png", caption: "Identifiants Microsoft recuperes dans le KeePass" },
    ],
    details: [
      "CUPP en mode interactif avec profil OSINT de Raptor Dissident (Ismail Ouslimani)",
      "Pas de leet mode ni caracteres speciaux — wordlist de 5525 entrees",
      "Hydra SSH : mot de passe trouve = Tampo2020 (nom du Shar Pei + annee)",
      "Connexion SSH, localisation du fichier KEEPASS_EVAL_V2.kdb",
      "Hashcat mode 13400 avec wordlist native Kali nmap.lst : cracke en 9s → chicken",
      "KeePass contenait 2 comptes Microsoft Outlook",
    ],
    findings: [
      "SSH : raptor / Tampo2020",
      "KeePass master : chicken",
      "Microsoft : eval.cyberxv@outlook.com / LebronJames23",
      "Microsoft : tp.cyberxv@outlook.com / LebronJames23",
    ],
  },
  {
    id: 3,
    title: "Phishing",
    date: "Zphisher + Mail HTML",
    content: "Page de phishing Snapchat + campagne de mail + capture d'identifiants.",
    category: "Social Engineering",
    icon: Fingerprint,
    relatedIds: [2, 4],
    status: "completed",
    energy: 100,
    points: "/4",
    pointsMax: 4,
    pointsObtained: 4,
    commands: [
      "bash zphisher.sh → Snapchat",
      "# CyberKit Module 3 — Option 2 (serveur HTTP port 80)",
      "# Mail HTML avec alerte securite Snapchat",
    ],
    screenshots: [
      { src: "screenshots/screenshot_snapchat_windows.png", caption: "Page de phishing Snapchat — test local depuis Windows" },
      { src: "screenshots/ids_snapchat_recupéré_kali.png", caption: "Identifiants captures cote Kali (test local)" },
      { src: "screenshots/screen_mail_envoyé.png", caption: "Mail de phishing envoye" },
      { src: "screenshots/mail_reçu_cote_victime.png", caption: "Mail recu cote victime" },
      { src: "screenshots/page_snap_ouverte_victime.png", caption: "Page Snapchat ouverte via le lien du mail" },
      { src: "screenshots/ids_reçu_snapchat_via_mail_victime.png", caption: "Identifiants captures via le mail de phishing" },
    ],
    details: [
      "Template Snapchat genere par Zphisher, servi via CyberKit sur le port 80",
      "Test local reussi : page accessible depuis Windows, identifiants captures",
      "Mail HTML imitant une alerte securite Snapchat (connexion suspecte)",
      "Bouton 'Verifier mon compte' pointant vers l'IP de la Kali",
      "Chaine complete validee : mail → clic victime → fausse page → capture des IDs",
    ],
    findings: [
      "Page Snapchat fonctionnelle sur port 80",
      "Mail credible avec urgence (suspension 24h)",
      "Identifiants victime captures avec succes",
    ],
  },
  {
    id: 4,
    title: "MITM",
    date: "Bettercap ARP Spoof",
    content: "ARP Spoofing pour intercepter le trafic et capturer des credentials HTTP.",
    category: "Network",
    icon: Shield,
    relatedIds: [3, 5],
    status: "completed",
    energy: 100,
    points: "/4",
    pointsMax: 4,
    pointsObtained: 4,
    commands: [
      "# CyberKit Module 4 — Option 1 (configure target 10.0.2.15)",
      "# CyberKit Module 4 — Option 3 (ARP Spoof + Sniff)",
      "# Bettercap : arp.spoof on + net.sniff on",
    ],
    screenshots: [
      { src: "screenshots/Configuration_cible_et_lancement_spoof_sniff.png", caption: "Configuration de la cible et lancement ARP Spoof" },
      { src: "screenshots/arp_spoof_actif.png", caption: "ARP Spoofing actif — detection des machines" },
      { src: "screenshots/accès_vbsca_pVM_windows.png", caption: "Victime accede a vbsca.ca depuis Windows" },
      { src: "screenshots/mitm_ids_interceptes.png", caption: "Identifiants interceptes via MITM (POST HTTP)" },
      { src: "screenshots/ids_recup_sur_bettercap.png", caption: "Credentials recuperes dans Bettercap" },
    ],
    details: [
      "Configuration cible 10.0.2.15 (Windows) via CyberKit Module 4",
      "ARP Spoofing positionne la Kali entre la victime et la gateway",
      "Tout le trafic HTTP de la victime transite par notre machine",
      "Test sur http://vbsca.ca/login/login.asp — credentials captures en clair",
      "Requete POST interceptee : txtUsername et txtPassword visibles",
    ],
    findings: [
      "ARP Spoofing operationnel sur 10.0.2.15",
      "Trafic HTTP intercepte en temps reel",
      "Credentials vbsca.ca captures en clair",
    ],
  },
  {
    id: 5,
    title: "DNS Spoofing",
    date: "Bettercap DNS + HTTP",
    content: "Redirection DNS de snapchat.com vers le serveur de phishing.",
    category: "Network",
    icon: Globe,
    relatedIds: [4, 6],
    status: "completed",
    energy: 100,
    points: "/3",
    pointsMax: 3,
    pointsObtained: 3,
    commands: [
      "# CyberKit Module 4 — Option 4 (ARP + DNS Spoof + Sniff)",
      "set dns.spoof.domains snapchat.com",
      "set dns.spoof.address 10.0.2.6",
      "dns.spoof on",
    ],
    screenshots: [
      { src: "screenshots/dns_snapchat.com_accessible_vm_windows.png", caption: "snapchat.com redirige vers la page de phishing depuis Windows" },
    ],
    details: [
      "DNS Spoofing configure via CyberKit Module 4 — Option 4",
      "Domaine spoofe : snapchat.com → 10.0.2.6 (Kali)",
      "Serveur HTTP CyberKit sur port 80 sert la fausse page Snapchat",
      "La victime tape snapchat.com et arrive sur notre page de phishing",
      "HSTS contourne en utilisant HTTP explicite",
    ],
    findings: [
      "DNS Spoofing operationnel",
      "snapchat.com → page de phishing Kali",
      "Identifiants captures via domaine spoofe",
    ],
  },
  {
    id: 6,
    title: "HTTPS",
    date: "OpenSSL + Certificat",
    content: "Certificat auto-signe pour servir le phishing en HTTPS.",
    category: "Crypto",
    icon: Lock,
    relatedIds: [5],
    status: "pending",
    energy: 30,
    points: "/2",
    pointsMax: 2,
    pointsObtained: 0,
    commands: [
      "openssl req -x509 -newkey rsa:4096 -keyout /tmp/key.pem -out /tmp/cert.pem -days 365 -nodes -subj '/CN=snapchat.com'",
      "# CyberKit Module 3 — Option 3 (serveur HTTPS port 443)",
    ],
    screenshots: [],
    details: [
      "Non realise pendant l'evaluation par manque de temps",
      "Le certificat auto-signe aurait ete genere avec OpenSSL",
      "Le serveur HTTPS de CyberKit aurait servi la page sur le port 443",
      "La victime aurait vu un warning certificat mais aurait pu acceder a la page",
    ],
    findings: [
      "Non complete",
    ],
  },
];

export const totalPoints = evalSteps.reduce((acc, step) => acc + step.pointsMax, 0);
export const obtainedPoints = evalSteps.reduce((acc, step) => acc + step.pointsObtained, 0);
