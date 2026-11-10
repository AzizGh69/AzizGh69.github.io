# Builds both CVs as LaTeX from one content source, compiles them with Tectonic,
# and checks what an ATS would read: one page, text order, plain hyphens, links.
import subprocess, sys
import pymupdf

sys.stdout.reconfigure(encoding="utf-8")
TECTONIC = r"C:\Users\aziz6\AppData\Local\Programs\tectonic\tectonic.exe"

PRE = r"""\documentclass[10pt]{article}
\usepackage[a4paper,left=1.35cm,right=1.35cm,top=1.0cm,bottom=0.9cm]{geometry}
\usepackage{fontspec}
\setmainfont{IBMPlexSans}[Extension=.otf,UprightFont=*-Regular,BoldFont=*-SemiBold,ItalicFont=*-Italic,BoldItalicFont=*-SemiBoldItalic]
\usepackage{xcolor}
\definecolor{accent}{HTML}{123C9C}
\definecolor{soft}{HTML}{555555}
\usepackage{enumitem}
\setlist[itemize]{leftmargin=1.05em,itemsep=0.3pt,topsep=1pt,parsep=0pt,label={\color{accent}\textbullet}}
\usepackage{titlesec}
\titleformat{\section}{\color{accent}\bfseries\fontsize{10.5}{12}\selectfont}{}{0pt}{\MakeUppercase}[\vspace{-5pt}{\color{accent}\rule{\linewidth}{0.7pt}}]
\titlespacing*{\section}{0pt}{4.5pt}{0.5pt}
\usepackage[colorlinks=true,urlcolor=accent,linkcolor=accent,pdfauthor={Mohamed Aziz Ghazouani}]{hyperref}
\pagestyle{empty}
\setlength{\parindent}{0pt}
\linespread{1.0}
\AtBeginDocument{\fontsize{9.4}{11.3}\selectfont}
\hyphenpenalty=10000 \exhyphenpenalty=10000 \sloppy
\newcommand{\entry}[3]{\par\vspace{2pt}\textbf{#1}#2\hfill{\color{soft}#3}\par}
\newcommand{\sub}[1]{{\itshape\color{soft}#1\par}}
\newcommand{\sep}{\enspace\textperiodcentered\enspace}
"""


def tex(s):
    return s.replace("&", r"\&").replace("%", r"\%").replace("~", r"\textasciitilde{}").replace("#", r"\#")


def link(url, text):
    return r"\href{%s}{%s}" % (url, text)


def items(xs):
    return "\\begin{itemize}\n" + "".join("\\item " + tex(x) + "\n" for x in xs) + "\\end{itemize}\n"


ABOUT = (
    "Business Intelligence student at IHEC Carthage, building things since I was 13, when I shipped my first Unity game. "
    "Today I run " + link("https://kalori-app.com", "Kalori") + ", a nutrition app for Tunisian food that I designed, built and operate alone, "
    "from the database to the AI that suggests meals, with 20+ people using it in testing. "
    "Sixteen months of full-time bilingual support at Concentrix taught me to listen to users before writing code; "
    "leading HEC Finance Academy's IT department taught me to deliver for 220 hackathon participants on a deadline. "
    "Looking for a 4--6 month final-year internship (PFE) from 02/2027 across data, AI and product."
)

K = {
    "ai": r"\textbf{Built the AI meal suggestions:} a rules-based recommender and an LLM provider chain (Anthropic, OpenAI-compatible) with an output guard, fallback and per-call cost metering, checked by a trust audit over 648 situations.",
    "ai_all": r"\textbf{Built the AI meal suggestions:} a rules-based recommender and an LLM provider chain (Anthropic, OpenAI-compatible) with an output guard, fallback and per-call cost metering, over 106 Tunisian dishes, checked by a trust audit over 648 situations.",
    "ai_short": r"\textbf{Added LLM meal suggestions} with per-call cost tracking, over 106 Tunisian dishes with counted nutrition values.",
    "solo": r"\textbf{Developed the whole product alone} in 570+ commits: NestJS/TypeScript API, PostgreSQL, Redis, an offline React PWA, Firebase and Cloudflare.",
    "ci": r"\textbf{Industrialised delivery:} GitHub Actions CI with 8 required checks and ~3,100 automated tests, blue/green deployment with automatic rollback.",
    "dp": r"\textbf{Designing a data platform} (in progress): synthetic data in Python, PostgreSQL on AWS RDS via Terraform, pseudonymised extraction, change data capture (Debezium, Kafka), a medallion lakehouse on Microsoft Fabric and Power BI, run with a project charter, risk register and ADRs.",
}
BOT = {
    "lead": r"\textbf{Led the chatbot:} Retrieval-Augmented Generation (RAG) with ChromaDB and Llama, and model fine-tuning.",
    "clean": r"\textbf{Cleaned and structured 550+ catalogue records} (23 fields: titles, authors, ISBN, call numbers) before indexing.",
}
SKILLS = {
    "genai": [
        ("AI & Data Science", "LLMs in production, Python, pandas, scikit-learn, RAG, embeddings, ChromaDB, Llama, fine-tuning, data cleaning"),
        ("Development", "TypeScript, NestJS, Firebase Auth / TOTP, JavaScript, Java, C#, PHP, React, Next.js, Postman, Git, Sentry, system design"),
        ("Data Engineering", "SQL, PySpark, ETL/ELT, CDC (Debezium, Kafka), medallion architecture, Microsoft Fabric, Power BI"),
        ("Cloud & DevOps", "Docker, n8n, AWS, Terraform (Infrastructure as Code), Podman, GitHub Actions (CI/CD), Cloudflare, Linux"),
        ("Databases", "PostgreSQL, Redis, MySQL, Oracle, Firebase"),
    ],
    "all": [
        ("AI & Data Science", "LLMs in production, Python, pandas, numpy, Streamlit, scikit-learn, RAG, embeddings, ChromaDB, Llama, fine-tuning, data cleaning"),
        ("Data Engineering", "SQL, PySpark, ETL/ELT, CDC (Debezium, Kafka), medallion architecture, Microsoft Fabric, Power BI"),
        ("Development", "TypeScript, NestJS, Firebase Auth / TOTP, JavaScript, Java, C#, PHP, React, Next.js, Postman, Git, Sentry, system design"),
        ("Cloud & DevOps", "AWS, Terraform (Infrastructure as Code), Docker, Podman, GitHub Actions (CI/CD), Cloudflare, Linux, n8n"),
        ("Databases", "PostgreSQL, Redis, MySQL, Oracle, Firebase"),
    ],
    "de": [
        ("Data Engineering", "SQL, PySpark, ETL/ELT, CDC (Debezium, Kafka), medallion architecture, Microsoft Fabric, Power BI"),
        ("AI & Data Science", "Python, pandas, numpy, Streamlit, scikit-learn, RAG, LLMs in production, embeddings, ChromaDB, Llama, fine-tuning, data cleaning"),
        ("Cloud & DevOps", "AWS, Terraform (Infrastructure as Code), Docker, Podman, GitHub Actions (CI/CD), Cloudflare, Linux, n8n"),
        ("Databases", "PostgreSQL, MySQL, Oracle, Redis, Firebase"),
        ("Development", "React, TypeScript, JavaScript, Java, C#, PHP, NestJS, Next.js, Postman, Git, Sentry, system design"),
    ],
}
NAMES = {"all": "Mohamed-Aziz-Ghazouani-CV", "genai": "Mohamed-Aziz-Ghazouani-CV-GenAI-LLM", "de": "Mohamed-Aziz-Ghazouani-CV-Data-Engineering"}


def build(kind):
    # The all-in-one CV names no specialty: the breadth is the point.
    title = {"all": "", "genai": r"Generative AI \& LLM \textbar{} ", "de": r"Data Engineering \textbar{} "}[kind]
    kalori = {"all": [K["ai_all"], K["solo"], K["ci"], K["dp"]],
              "genai": [K["ai"], K["solo"], K["ci"], K["dp"]],
              "de": [K["dp"], K["solo"], K["ci"], K["ai_short"]]}[kind]
    bot = [BOT["clean"], BOT["lead"]] if kind == "de" else [BOT["lead"], BOT["clean"]]
    s = PRE + "\\begin{document}\n"
    s += r"{\fontsize{21}{24}\selectfont\bfseries Mohamed Aziz GHAZOUANI\par}" + "\n\\vspace{2pt}\n"
    s += r"{\color{accent}\bfseries\fontsize{11}{13}\selectfont " + title + r"Final-year internship (PFE) from 02/2027\par}" + "\n\\vspace{2pt}\n"
    s += r"{\small Ben Arous, Tunisia\sep +216 25 004 537\sep " + link("mailto:aziz19ghazouani@gmail.com", "aziz19ghazouani@gmail.com") + r"\par" + "\n"
    s += r"\sep ".join([
        link("https://aziz-ghazouani.pages.dev", "Portfolio: aziz-ghazouani.pages.dev"),
        link("https://www.linkedin.com/in/aziz-ghazouani/", "linkedin.com/in/aziz-ghazouani"),
        link("https://github.com/AzizGh69", "github.com/AzizGh69"),
    ]) + r"\par}" + "\n"
    s += "\\section{About}\n" + ABOUT + "\n"
    s += "\\section{Education}\n"
    s += r"\entry{Bachelor in Business Intelligence}{ \textendash{} IHEC Carthage, Tunis}{09/2024 \textendash{} 06/2027}" + "\n"
    s += r"\sub{3rd year\sep average 14.5/20\sep graduation expected 06/2027}" + "\n"
    s += r"\entry{Baccalaureate in Computer Science}{ \textendash{} highest honours (mention Très bien)}{06/2024}" + "\n"
    s += "\\section{Projects}\n"
    s += r"\entry{Kalori}{ \textendash{} Founder \& sole developer\sep " + link("https://kalori-app.com", "kalori-app.com") + r"}{06/2026 \textendash{} present}" + "\n"
    s += r"\sub{Nutrition tracker built around Tunisian food (EN/FR/AR), in testing with 20+ active users}" + "\n"
    s += items(kalori)
    s += r"\entry{IHEC BOT}{ \textendash{} AI assistant for the university library (team project)}{02/2025}" + "\n" + items(bot)
    s += r"\entry{Valorant Agent Assistant}{ \textendash{} Personal machine-learning project\sep " + link("https://github.com/AzizGh69/ValorantAgentAssistant", "GitHub") + "}{12/2025}\n"
    s += items([r"\textbf{Trained a decision-tree classifier} (scikit-learn, pandas) recommending 1 of 19 weapons, evaluated on a held-out test set; built a 180-scenario quiz and Streamlit and Tkinter interfaces."])
    s += "\\section{Experience}\n"
    s += r"\entry{Technical Support Agent}{ \textendash{} Concentrix, Tunis (Lac 2)}{06/2025 \textendash{} 09/2026}" + "\n"
    s += items([
        r"\textbf{Diagnosed and resolved technical incidents} full time for French- and English-speaking clients.",
        r"\textbf{Analysed client needs} on consulting tasks and recommended suitable solutions.",
    ])
    s += r"\entry{Technical Lead}{ \textendash{} HEC Finance Academy (HECFA), IHEC Carthage\sep " + link("https://hecfa.com", "hecfa.com") + r"}{07/2025 \textendash{} 10/2026}" + "\n"
    s += r"\sub{Student club\sep executive board, elected co-head of the IT department\sep member since 10/2024, alumni since 10/2026}" + "\n"
    s += items([
        r"\textbf{Delivered 5 production apps for the CodeLab 2.0 hackathon} (220 participants, 12 teams) in Next.js, React and Firebase: registration and payments, participant tracking, support, jury scoring, ambassadors.",
        r"\textbf{Built the club's recruitment platform:} application form and filtering dashboard, 321 applications processed.",
        r"\textbf{Maintained and deployed hecfa.com} and its domain configuration as IT department co-lead.",
        r"\textbf{Won 1st prize at Global Entrepreneurship Week} (IHEC, 11/2025): IHEC Connect prototype, 1,500 TND for the club.",
        r"\textbf{Received a recognition certificate} for the CodeLab 1.0 hackathon (2025), as a member.",
    ])
    s += "\\section{Skills}\n" + "".join("\\textbf{%s:} %s\\par\n" % (tex(a), tex(b)) for a, b in SKILLS[kind])
    s += r"\section{Certifications, languages \& involvement}" + "\n"
    s += r"\textbf{Certifications:} AWS Knowledge: Cloud Essentials (Amazon Web Services, 2026)\sep IBM Data Fundamentals (IBM, 2026)\par" + "\n"
    s += r"\textbf{Languages:} Arabic (native)\sep French (B2)\sep English (C1), levels assessed in the Concentrix recruitment test\par" + "\n"
    s += r"\textbf{Involvement:} Photography Lab, IHEC Carthage (10/2026 \textendash{} present)\sep IEEE Computer Society, INSAT SBC (09/2024 \textendash{} 06/2025)\par" + "\n"
    s += "\\end{document}\n"
    name = NAMES[kind]
    open(name + ".tex", "w", encoding="utf-8").write(s)
    r = subprocess.run([TECTONIC, "-X", "compile", name + ".tex"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode:
        print(r.stdout[-1500:], r.stderr[-1500:])
        raise SystemExit(name + " failed")
    d = pymupdf.open(name + ".pdf")
    text = "".join(p.get_text() for p in d)
    p = d[0]
    print(f"{name}: pages={d.page_count} links={len(p.get_links())} ends_y={round(max(w[3] for w in p.get_text('words')))}/842 "
          f"bad_hyphens={text.count(chr(0x2011)) + text.count(chr(0x2010))} replacement_chars={text.count(chr(0xFFFD))}")
    for i, pg in enumerate(d):
        pg.get_pixmap(dpi=110).save(f"{name}-p{i + 1}.png")
    open(name + ".txt", "w", encoding="utf-8").write(text)


# Only the complete CV is published; "genai" and "de" remain buildable here.
for k in ("all",):
    build(k)
