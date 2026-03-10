# Domeinmigratie naar Cloudflare

Dit document beschrijft de stappen om alle domeinen bij Cloudflare te consolideren met SEO-vriendelijke redirects.

## Overzicht

| Domein | Huidige situatie | Actie | SEO |
|--------|------------------|--------|-----|
| **mieras.xyz** | Proton (mail), hoofdsite | DNS bij Cloudflare; site → Cloudflare Pages. Mail (MX, SPF, DKIM) ongewijzigd voor Proton. | Canonical domain. |
| **mier.as** | iwantmyname (registrar) | Niet verplaatsen. 301 redirect mier.as → https://mieras.xyz instellen bij iwantmyname. | 301 = link equity naar mieras.xyz. |
| **maartenmieras.nl** | Antagonist | Transfer naar Cloudflare Registrar. Daarna 301 redirect → https://mieras.xyz. | Eén canonical URL. |
| **mieras.org** | Antagonist | Transfer naar Cloudflare. 301 → https://mieras.xyz. | Idem. |
| **jipmieras.nl** | Antagonist | Transfer naar Cloudflare. 301 → https://jip.mieras.xyz. | Subdomain als doel. |
| **losbangeles.com** (WordPress) | Elders gehost | DNS naar Cloudflare (nameservers wijzigen). WordPress blijft op huidige host; Orange Cloud voor proxy/cache. Optioneel: hosting later migreren. | Geen canonical-wijziging. |

---

## Stappenplan

### 1. mieras.xyz

- Site deployen op **Cloudflare Pages** (Git-koppeling of upload van `dist/`).
- In Cloudflare DNS: record voor het domein (of `www`) wijzen naar de Pages-URL (CNAME of A/AAAA volgens Cloudflare).
- **Mail**: MX-, SPF-, DKIM-records voor Proton niet wijzigen.

### 2. mier.as

- Domein blijft bij **iwantmyname** (.as wordt vaak niet ondersteund door Cloudflare Registrar).
- Bij iwantmyname: **URL forward / redirect** instellen:
  - Van: `https://mier.as` en `http://mier.as`
  - Naar: `https://mieras.xyz`
  - Type: **301 Permanent**.
- Controleren of iwantmyname 301 ondersteunt; anders documentatie/support raadplegen.

### 3. maartenmieras.nl, mieras.org, jipmieras.nl

Voor elk domein:

1. **Bij Antagonist**
   - Domein unlocken.
   - EPP / auth code ophalen.

2. **Bij Cloudflare**
   - **Domains** → **Transfer** (of Register/Transfer).
   - Domeinnaam + EPP-code invoeren en transfer starten.

3. **Na voltooiing van de transfer**
   - In Cloudflare: **Rules** → **Redirect Rules** (of Page Rules).
   - Nieuwe regel:
     - **If**: Hostname equals `[domein]` (bijv. `maartenmieras.nl`).
     - **Then**: Redirect to `https://mieras.xyz` (of voor jip: `https://jip.mieras.xyz`) met status **301**.

### 4. losbangeles.com (WordPress)

- **Alleen DNS**
  - In Cloudflare: **Add site** → domein toevoegen.
  - Nameservers bij de huidige registrar wijzigen naar de door Cloudflare gegeven nameservers.
  - WordPress blijft op de bestaande host; Cloudflare als proxy (Orange Cloud) voor cache en bescherming.

- **Hosting later verplaatsen** (optioneel)
  - WordPress migreren naar een andere host (bijv. Cloudflare-partner of host met goede HTTP/2 + cache).
  - Daarna DNS (eventueel al bij Cloudflare) naar de nieuwe host wijzen.

---

## Opmerkingen

- **mier.as**: Als iwantmyname alleen een frame-redirect of 302 biedt, vraag dan om 301 of zoek in hun docs naar “301 permanent redirect”.
- **T&C PDF**: Plaats het Algemene Voorwaarden-document in `public/terms.pdf` zodat de link op de site werkt.
