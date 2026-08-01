# Digital Twin Cyberattack Reference Guide

This comprehensive reference document contains API links, open-source code repositories, high-fidelity datasets, and structured attack profile templates for building and expanding your Digital Twin cybersecurity learning platform.

---

## 1. Free APIs & Structured Databases (Direct Integration)

Use these resources to programmatically pull structured threat data and techniques directly into your application's database or frontend.

### A. MITRE ATT&CK for ICS (STIX 2.1 API)
*   **Description:** The definitive global standard matrix mapping real-world adversary tactics, techniques, and mitigation vectors specifically for Industrial Control Systems (ICS) and Cyber-Physical Systems (CPS).
*   **Format:** Machine-readable STIX 2.1 JSON structure.
*   **Access Method:** Public TAXII 2.1 Server API endpoint.
*   **Base URL:** `https://cti-taxii.mitre.org/taxii/`
*   **Python Integration Snippet:**
    ```python
    from taxii2client.v20 import Server
    from stix2 import TAXIISource, Filter

    # Connect to the public MITRE Threat Intelligence server
    server = Server("https://cti-taxii.mitre.org/taxii/")
    api_root = server.api_roots[0] # Fetch primary root
    source = TAXIISource(api_root)

    # Filter strictly for industrial control system attack patterns
    ics_patterns = source.query([Filter('type', '=', 'attack-pattern')])
    ```

### B. Operational Technology Cyber Attack Database (OTCAD)
*   **Description:** A community-centric database explicitly detailing historical, real-world cyber incidents hitting operational technology environments, mapped straight to MITRE tactics.
*   **Format:** Publicly accessible raw `.csv` and `.json` data tables.
*   **Repository Location:** `https://github.com/bvcyber/OTCAD`
*   **Integration Method:** Set up automated backend scripts to poll their raw files to sync newly cataloged incidents directly to your system.

---

## 2. Open-Source Code Repositories & Reference Implementations

Review these open codebases to understand how industry experts architecture security monitors, simulated attacks, and behavioral sandboxes for virtual twins.

*   **CyberX-AI-Digital-Twin:** A web-based application (built via Flask) mapping an isolated network grid. It utilizes machine learning models (XGBoost, BERT) to parse, simulate, and actively alert on attack vectors like SQL injection, Session Hijacking, and XSS across virtual logs.
    *   *Source:* `https://github.com/createunique/CyberX-AI-Digital-Twin`
*   **Digital Twin Consortium Open Ecosystem:** Official frameworks, reference architecture documentation, and code stubs distributed by the leading international digital twin industrial group.
    *   *Source:* `https://www.digitaltwinconsortium.org/initiatives/open-source/`

---

## 3. High-Fidelity Attack Datasets (For Hands-On Data Labs)

Incorporate these real-world log captures into your learning platform as downloadable telemetry files. This allows advanced students to run data visualization or threat detection labs.

*   **HAI (HIL-based Augmented ICS) Security Dataset:** A massive, multi-industry repository tracking normal operating variables alongside multi-stage cyberattacks across boiler systems, water treatment loops, and general industrial environments.
    *   *Data Formats:* Standard normalized `.csv` logs.
    *   *Source:* `https://github.com/icsdataset/hai`
*   **Awesome-Cybersecurity-Datasets:** A meticulously curated master index providing direct paths to raw PCAP (packet capture) files, network anomalies, and hardware logs.
    *   *Source:* `https://github.com/shramos/Awesome-Cybersecurity-Datasets`

---

## 4. Standardized Attack Anatomy Template (UI Layout)

When formatting incoming API payloads or manual entries for display on your frontend dashboard, use this structured schema to ensure maximum pedagogical clarity.

| Profile Component | Core Definition / Field Purpose | Practical Mapping Example |
| :--- | :--- | :--- |
| **Attack Vector** | The technical entry pathway exploited by the adversary. | Man-in-the-Middle (MitM) intercepting unencrypted MQTT broker traffic. |
| **Twin Component Impacted** | The specific layer or boundary in the DT architecture breached. | Data Ingestion Layer (Physical-to-Virtual telemetry pipeline). |
| **Physical Consequence** | The concrete kinetic effect or risk manifested in the real-world. | Cooling pump motor overheating due to spoofed low-temperature sensor feeds. |
| **Defensive Mitigation** | Actionable security control or architecture fix to halt the attack. | Enforce end-to-end TLS 1.3 encryption and implement cryptographic payload signing. |

---

## 5. Architectural Attack Surfaces Reference Check

When teaching users about vulnerability design, make sure they analyze all three major interface junctions:

1.  **The Physical-to-Virtual Feed (Telemetry):** Susceptible to Data Poisoning, packet dropping, or signal spoofing to trick the twin's predictive logic.
2.  **The Twin Core Layer (Cloud/Edge Data Store):** Vulnerable to Reverse Engineering, malicious model manipulation, and critical Intellectual Property theft.
3.  **The Virtual-to-Physical Path (Control Loops):** Vulnerable to unauthorized reverse command injection, allowing attackers to manipulate heavy machinery remotely.
