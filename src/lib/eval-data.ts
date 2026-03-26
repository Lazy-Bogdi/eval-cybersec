import {
  Radar,
  KeyRound,
  Fingerprint,
  Shield,
  Globe,
  Lock,
} from "lucide-react";

export interface Section {
  title?: string;
  text: string;
  commands?: string[];
  screenshot?: { src: string; caption: string };
  note?: string;
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
  sections: Section[];
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
    sections: [
      {
        title: "Scan de decouverte reseau",
        text: "Premiere etape : identifier la machine cible sur le reseau. Utilisation de CyberKit (Module 1 — Option 1) pour lancer un scan de decouverte Nmap sur l'ensemble du subnet 10.0.2.0/24. Ce scan envoie des requetes ARP a toutes les adresses du sous-reseau pour determiner quelles machines sont actives.",
        commands: ["sudo nmap -sn 10.0.2.0/24"],
        screenshot: { src: "/screenshots/Decouverte_reseau_pour_identifier_la_cible.png", caption: "Scan de decouverte reseau — 5 hotes detectes sur le subnet" },
        note: "5 hotes detectes. La machine cible est identifiee a l'adresse 10.0.2.9 grace a son adresse MAC Oracle VirtualBox (08:00:27:5B:8D:EC). Les autres machines sont la gateway (10.0.2.1), le serveur DHCP (10.0.2.2), le DNS (10.0.2.3) et notre Kali (10.0.2.6).",
      },
      {
        title: "Scan de ports et services",
        text: "Maintenant qu'on connait l'IP de la cible, on effectue un scan de ports avec detection de versions pour identifier les services exposes. CyberKit Module 1 — Option 2 lance un scan nmap -sV qui interroge chaque port ouvert pour determiner le logiciel et la version qui tourne dessus.",
        commands: ["sudo nmap -sV 10.0.2.9"],
        screenshot: { src: "/screenshots/scan_ip_cible.png", caption: "Scan de ports — identification des services FTP et SSH" },
        note: "Deux services sont exposes : FTP (vsftpd 3.0.3) sur le port 21 et SSH (OpenSSH 9.2p1 Debian) sur le port 22. Ces deux services acceptent une authentification par mot de passe, ce qui les rend vulnerables a une attaque par brute force. Le scan revele aussi que la cible tourne sous Debian Linux.",
      },
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
    sections: [
      {
        title: "Profiling OSINT avec CUPP",
        text: "Avant de lancer un brute force, il faut generer une wordlist pertinente. CUPP (Common User Passwords Profiler) cree des mots de passe probables a partir d'informations personnelles sur la cible. On utilise les donnees OSINT collectees sur Raptor Dissident (Ismail Ouslimani) : date de naissance, nom de sa compagne, noms de ses animaux de compagnie, etc.",
        commands: ["python3 cupp.py -i"],
        screenshot: { src: "/screenshots/infos_raptor_cupp.png", caption: "Saisie des informations OSINT dans CUPP" },
        note: "Informations utilisees : prenom Ismail, nom Ouslimani, surnom Raptor, ne le 22/08/1993, compagne Betty (Autier), animal Tampo. Mots-cles ajoutes : petitpotam, petitours, batom, fonte, musculation, toulouse, orsay, shar. Pas de leet mode ni de caracteres speciaux, conformement aux consignes de l'evaluation.",
      },
      {
        title: "Wordlist generee",
        text: "CUPP genere automatiquement toutes les combinaisons possibles a partir des informations fournies : concatenations prenom+date, surnom+annee, animal+chiffres, etc.",
        screenshot: { src: "/screenshots/wordlist_Ismail_généré.png", caption: "Wordlist ismail.txt generee — 5525 mots de passe" },
        note: "La wordlist contient 5525 mots de passe potentiels. Elle est sauvegardee sous le nom ismail.txt. C'est cette liste qui sera utilisee par Hydra pour tenter de s'authentifier sur les services SSH et FTP.",
      },
      {
        title: "Brute Force SSH avec Hydra",
        text: "Lancement de Hydra sur le service SSH (port 22) avec le login « raptor » et la wordlist CUPP. Hydra va tester chaque mot de passe de la liste jusqu'a trouver le bon. On utilise 16 threads pour accelerer le processus.",
        commands: ["hydra -l raptor -P /home/hlom/Bureau/ismail.txt ssh://10.0.2.9 -t 16"],
        screenshot: { src: "/screenshots/Lancement_du_brute_force_ssh.png", caption: "Hydra en cours d'execution sur SSH" },
      },
      {
        title: "Mot de passe SSH trouve",
        text: "Hydra a trouve le mot de passe SSH en testant les combinaisons de la wordlist CUPP.",
        screenshot: { src: "/screenshots/resultat_bruteforce_ssh.png", caption: "Hydra a trouve le mot de passe : Tampo2020" },
        note: "Le mot de passe est Tampo2020 — base sur le nom du Shar Pei de la cible (Tampo) combine avec l'annee 2020. Cela confirme l'efficacite du profiling OSINT : les gens utilisent souvent des informations personnelles dans leurs mots de passe.",
      },
      {
        title: "Brute Force FTP en parallele",
        text: "En parallele du SSH, un second terminal lance Hydra sur le service FTP (port 21) avec la meme wordlist. Le but est de maximiser la couverture et de verifier si les memes credentials fonctionnent sur plusieurs services.",
        commands: ["hydra -l raptor -P /home/hlom/Bureau/ismail.txt ftp://10.0.2.9 -t 16"],
        screenshot: { src: "/screenshots/Lancement_brute_force_ftp.png", caption: "Brute force FTP lance en parallele" },
        note: "Le brute force SSH ayant abouti en premier, il est probable que le meme mot de passe fonctionne aussi sur FTP (meme utilisateur, meme machine).",
      },
      {
        title: "Connexion SSH et recherche du KeePass",
        text: "Avec les identifiants obtenus (raptor / Tampo2020), on se connecte en SSH a la machine cible. Une fois connecte, on cherche un fichier KeePass sur le systeme de fichiers avec la commande find.",
        commands: [
          "ssh raptor@10.0.2.9",
          "find / -name '*.kdb*' 2>/dev/null",
        ],
        screenshot: { src: "/screenshots/connexion_ssh_keepass.png", caption: "Connexion SSH reussie et fichier KeePass trouve" },
        note: "Fichier trouve : /home/raptor/KEEPASS_EVAL_V2.kdb (format KeePass v1). Ce fichier contient potentiellement d'autres identifiants qui permettront un mouvement lateral.",
      },
      {
        title: "Recuperation du KeePass sur la Kali",
        text: "On transfere le fichier KeePass de la machine cible vers notre Kali via SCP (Secure Copy Protocol) pour pouvoir le cracker localement avec Hashcat.",
        commands: ["scp raptor@10.0.2.9:/home/raptor/KEEPASS_EVAL_V2.kdb ~/Bureau/"],
        screenshot: { src: "/screenshots/Recuperation_du_keepass_sur_kali.png", caption: "Transfert du fichier .kdb via SCP" },
      },
      {
        title: "Crack du KeePass avec Hashcat",
        text: "On extrait le hash du fichier KeePass avec keepass2john, puis on le nettoie (suppression du prefixe nom de fichier que Hashcat ne sait pas lire). Ensuite, on lance Hashcat en mode 13400 (KeePass) avec la wordlist native Kali nmap.lst (/usr/share/wordlists/nmap.lst) — une liste de ~5000 mots de passe courants.",
        commands: [
          "keepass2john ~/Bureau/KEEPASS_EVAL_V2.kdb > keepass_hash.txt",
          "sed -i 's/^KEEPASS_EVAL_V2.kdb://' keepass_hash.txt",
          "hashcat -m 13400 -a 0 keepass_hash.txt /usr/share/wordlists/nmap.lst --force",
        ],
        screenshot: { src: "/screenshots/lancement_brute_force_keepass.png", caption: "Hashcat en cours sur le hash KeePass" },
      },
      {
        title: "KeePass cracke",
        text: "Hashcat a trouve le mot de passe du KeePass en seulement 9 secondes.",
        screenshot: { src: "/screenshots/mdp_trouve_dans_keepass.png", caption: "Mot de passe KeePass cracke : chicken" },
        note: "Le mot de passe est « chicken » — c'etait le nom du 3eme animal de compagnie de la cible. La wordlist nmap.lst native de Kali (5007 entrees) contenait ce mot de passe courant. Cela montre qu'un mot de passe simple, meme sans lien OSINT direct, peut etre cracke tres rapidement.",
      },
      {
        title: "Contenu du KeePass",
        text: "On ouvre le fichier KeePass avec kpcli en utilisant le mot de passe cracke. A l'interieur, on trouve deux comptes Microsoft Outlook qui serviront pour le mouvement lateral (envoi de mails de phishing).",
        commands: [
          "kpcli --kdb ~/Bureau/KEEPASS_EVAL_V2.kdb",
          "# Password: chicken",
          "cd /Backup",
          "show -f 0",
          "show -f 1",
        ],
        screenshot: { src: "/screenshots/ids_found_inside_kdb_file.png", caption: "Deux comptes Microsoft decouverts dans le KeePass" },
        note: "Comptes recuperes : tp.cyberxv@outlook.com et eval.cyberxv@outlook.com, tous deux avec le mot de passe LebronJames23. Le compte eval sera utilise pour la campagne de phishing.",
      },
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
    sections: [
      {
        title: "Creation de la page de phishing Snapchat",
        text: "Utilisation de Zphisher pour generer une replique fidele de la page de connexion Snapchat. Zphisher embarque des templates pre-construits pour les principaux services (Instagram, Snapchat, Facebook, Google...). Les fichiers generes sont ensuite servis via le serveur HTTP de CyberKit (Module 3 — Option 2) sur le port 80, accessible depuis toutes les machines du reseau local.",
        commands: [
          "bash zphisher.sh",
          "# Selection du template Snapchat",
          "# CyberKit Module 3 — Option 2 : serveur HTTP sur 0.0.0.0:80",
        ],
      },
      {
        title: "Test local — page vue depuis Windows",
        text: "Avant d'envoyer le mail de phishing, on verifie que la page est accessible et fonctionnelle depuis la VM Windows (10.0.2.15) en accedant a http://10.0.2.6 (IP de la Kali).",
        screenshot: { src: "/screenshots/screenshot_snapchat_windows.png", caption: "Fausse page de connexion Snapchat vue depuis la VM Windows" },
        note: "La page est une replique fidele de la vraie page de connexion Snapchat. Un utilisateur non averti ne ferait pas la difference, surtout si le lien provient d'un mail d'apparence officielle.",
      },
      {
        title: "Test local — capture des identifiants",
        text: "On soumet des identifiants de test depuis la VM Windows. Le serveur HTTP de CyberKit capture les donnees POST et les affiche dans le terminal de la Kali.",
        screenshot: { src: "/screenshots/ids_snapchat_recupéré_kali.png", caption: "Identifiants de test captures cote Kali" },
        note: "Le serveur intercepte les champs username et password du formulaire, les sauvegarde dans /tmp/cyberkit_creds.txt, puis redirige la victime vers le vrai site Snapchat pour ne pas eveiller les soupcons.",
      },
      {
        title: "Redaction du mail de phishing",
        text: "On redige un mail HTML imitant une notification de securite Snapchat. Le mail alerte d'une « connexion inhabituelle detectee » avec de faux details (appareil, localisation, date). Un bouton « Verifier mon compte » pointe vers l'IP de la Kali (http://10.0.2.6). Le mail utilise les codes visuels de Snapchat : fond jaune #FFFC00, logo officiel, mise en page professionnelle, et un message de menace (suspension sous 24h) pour creer un sentiment d'urgence.",
        screenshot: { src: "/screenshots/screen_mail_envoyé.png", caption: "Mail de phishing Snapchat envoye depuis le compte compromis" },
      },
      {
        title: "Mail recu cote victime",
        text: "Le mail de phishing arrive dans la boite de reception de la victime. Il a l'apparence d'une notification de securite officielle Snapchat.",
        screenshot: { src: "/screenshots/mail_reçu_cote_victime.png", caption: "Mail de phishing recu — apparence credible" },
        note: "En entreprise, un mail envoye depuis un compte interne compromis aurait encore plus de chances de passer les filtres anti-spam (SPF/DKIM coherents avec le domaine).",
      },
      {
        title: "Victime ouvre la page via le mail",
        text: "La victime clique sur le bouton « Verifier mon compte » dans le mail et arrive sur la fausse page de connexion Snapchat hebergee sur notre Kali.",
        screenshot: { src: "/screenshots/page_snap_ouverte_victime.png", caption: "Page de phishing ouverte depuis le lien du mail" },
      },
      {
        title: "Capture des identifiants via le mail",
        text: "La victime entre ses identifiants Snapchat sur la fausse page. Le serveur de phishing les capture et les affiche en temps reel.",
        screenshot: { src: "/screenshots/ids_reçu_snapchat_via_mail_victime.png", caption: "Identifiants Snapchat captures apres soumission via le mail" },
        note: "La chaine d'attaque complete est validee : mail de phishing → clic victime → fausse page Snapchat → capture des identifiants. Le mouvement lateral est reussi : a partir des comptes Microsoft recuperes dans le KeePass, on a lance une campagne de phishing Snapchat et recupere de nouveaux identifiants.",
      },
    ],
    findings: [
      "Page Snapchat fonctionnelle sur port 80",
      "Mail credible avec urgence (suspension 24h)",
      "Identifiants victime captures avec succes",
      "Mouvement lateral valide",
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
    sections: [
      {
        title: "Principe de l'attaque MITM",
        text: "L'attaque Man-In-The-Middle (MITM) par ARP Spoofing consiste a envoyer de fausses reponses ARP sur le reseau local pour se faire passer pour la gateway aupres de la cible, et pour la cible aupres de la gateway. Resultat : tout le trafic de la victime transite par notre machine, ce qui permet de l'intercepter en temps reel. L'IP forwarding doit etre active pour que le trafic soit retransmis (sinon la victime perd sa connexion).",
      },
      {
        title: "Configuration de la cible",
        text: "On configure CyberKit (Module 4 — Option 1) avec l'IP de la VM Windows (10.0.2.15) comme cible et la gateway par defaut (10.0.2.1). CyberKit lance un scan Nmap rapide pour lister les machines disponibles.",
        screenshot: { src: "/screenshots/Configuration_cible_et_lancement_spoof_sniff.png", caption: "Configuration de la cible dans CyberKit" },
      },
      {
        title: "ARP Spoofing actif",
        text: "Lancement de l'ARP Spoofing + Sniffing automatique (Module 4 — Option 3). CyberKit active automatiquement l'IP forwarding, configure Bettercap avec la cible et la gateway, puis lance arp.spoof et net.sniff.",
        commands: [
          "# CyberKit active automatiquement :",
          "sysctl -w net.ipv4.ip_forward=1",
          "# Bettercap avec :",
          "set arp.spoof.targets 10.0.2.15",
          "arp.spoof on",
          "net.sniff on",
        ],
        screenshot: { src: "/screenshots/arp_spoof_actif.png", caption: "Bettercap avec ARP Spoofing actif — machines detectees" },
        note: "Bettercap detecte les machines du reseau (10.0.2.1, 10.0.2.2, 10.0.2.9, 10.0.2.15) et commence a envoyer des paquets ARP falsifies. Tout le trafic de la cible 10.0.2.15 transite desormais par notre Kali.",
      },
      {
        title: "Test d'interception — acces au site de test",
        text: "Depuis la VM Windows, la victime accede au site de test http://vbsca.ca/login/login.asp — un formulaire de connexion HTTP (non chiffre) ideal pour verifier que l'interception fonctionne.",
        screenshot: { src: "/screenshots/accès_vbsca_pVM_windows.png", caption: "Victime se connecte a vbsca.ca depuis Windows" },
      },
      {
        title: "Credentials interceptes",
        text: "Bettercap intercepte la requete POST HTTP envoyee par la victime et affiche les identifiants en clair dans le terminal. On voit le contenu du formulaire avec txtUsername et txtPassword.",
        screenshot: { src: "/screenshots/mitm_ids_interceptes.png", caption: "Requete POST interceptee — identifiants en clair" },
        note: "Bettercap capture la requete POST contenant txtUsername=blablabla et txtPassword=blablal,kfoen. Cela demontre que tout trafic HTTP (non chiffre) transitant par le reseau peut etre intercepte par un attaquant en position MITM. C'est pourquoi HTTPS est essentiel.",
      },
      {
        title: "Vue detaillee dans Bettercap",
        text: "Vue des credentials recuperes dans l'interface Bettercap avec le detail complet de la requete HTTP interceptee.",
        screenshot: { src: "/screenshots/ids_recup_sur_bettercap.png", caption: "Detail des credentials dans Bettercap" },
      },
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
    sections: [
      {
        title: "Principe du DNS Spoofing",
        text: "Le DNS Spoofing combine a l'ARP Spoofing permet de rediriger les requetes DNS de la victime. Quand la victime tape un nom de domaine dans son navigateur, sa requete DNS est interceptee par notre Kali (grace a l'ARP spoof) et Bettercap repond avec l'adresse IP de notre serveur de phishing au lieu de la vraie adresse du site.",
      },
      {
        title: "Configuration du DNS Spoofing",
        text: "On utilise CyberKit Module 4 — Option 4 (ARP + DNS Spoofing + Sniffing). Le domaine snapchat.com est redirige vers l'IP de la Kali (10.0.2.6) ou le serveur HTTP de phishing tourne sur le port 80. En parallele, le serveur HTTP de CyberKit (Module 3 — Option 2) doit etre actif pour servir la fausse page.",
        commands: [
          "# CyberKit Module 4 — Option 4 configure automatiquement :",
          "set arp.spoof.targets 10.0.2.15",
          "arp.spoof on",
          "set dns.spoof.all false",
          "set dns.spoof.domains snapchat.com",
          "set dns.spoof.address 10.0.2.6",
          "dns.spoof on",
          "net.sniff on",
        ],
        note: "dns.spoof.all est desactive pour ne pas perturber tout le trafic DNS de la victime — on ne spoofe que le domaine cible. Le serveur HTTP doit tourner en parallele dans un autre terminal.",
      },
      {
        title: "Acces depuis la VM Windows",
        text: "Depuis la machine victime (Windows 10.0.2.15), on tape http://snapchat.com dans le navigateur. Grace au DNS spoofing, la requete DNS est interceptee et Bettercap repond avec l'IP de la Kali. Le navigateur charge donc notre fausse page de connexion Snapchat au lieu du vrai site.",
        screenshot: { src: "/screenshots/dns_snapchat.com_accessible_vm_windows.png", caption: "snapchat.com redirige vers la page de phishing — DNS Spoofing reussi" },
        note: "Le DNS spoofing fonctionne : la victime accede a snapchat.com mais arrive sur notre fausse page de phishing. Note : on utilise http:// explicitement car snapchat.com est dans la liste HSTS preloaded des navigateurs. En contexte reel, on utiliserait un domaine typosquatte comme snnapchat.com pour contourner HSTS.",
      },
    ],
    findings: [
      "DNS Spoofing operationnel",
      "snapchat.com redirige vers Kali",
      "Combinaison ARP + DNS + phishing HTTP validee",
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
    sections: [
      {
        title: "Objectif",
        text: "L'objectif etait de generer un certificat SSL auto-signe avec OpenSSL et de lancer le serveur HTTPS de CyberKit (Module 3 — Option 3) sur le port 443. Combine au DNS spoofing, la victime accedant a https://snapchat.com aurait ete redirigee vers notre page de phishing avec un avertissement de certificat.",
        commands: [
          "openssl req -x509 -newkey rsa:4096 -keyout /tmp/key.pem -out /tmp/cert.pem -days 365 -nodes -subj '/CN=snapchat.com'",
          "# CyberKit Module 3 — Option 4 (generer certificat)",
          "# CyberKit Module 3 — Option 3 (serveur HTTPS port 443)",
        ],
      },
      {
        title: "Explication technique",
        text: "Le certificat auto-signe n'est pas emis par une autorite de certification (CA) reconnue, ce qui declenche un avertissement dans le navigateur de la victime. Cependant, si l'utilisateur accepte le risque et poursuit, il accede a la page de phishing via une connexion HTTPS chiffree. Le cadenas dans la barre d'adresse peut paradoxalement renforcer la credibilite de l'attaque pour un utilisateur non averti. Cette etape n'a pas ete realisee pendant l'evaluation par manque de temps.",
        note: "Non realise — 0/2 points. En contexte reel, un attaquant pourrait utiliser Let's Encrypt pour obtenir un vrai certificat sur un domaine typosquatte, ce qui eliminerait l'avertissement du navigateur.",
      },
    ],
    findings: [
      "Non complete — manque de temps",
    ],
  },
];

export const totalPoints = evalSteps.reduce((acc, step) => acc + step.pointsMax, 0);
export const obtainedPoints = evalSteps.reduce((acc, step) => acc + step.pointsObtained, 0);
