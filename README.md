# Grigiškių bokso klubo svetainė

Statinė svetainė (`index.html`, `styles.css`, `site.js`, `assets/`) ir valdymo programėlė `/valdymas/`, veikianti per Cloudflare Pages.

## Valdymo programėlė

Adresas: `https://<domenas>/valdymas/`

Joje tvarkoma: galerija, treniruočių tvarkaraštis, grupės, tekstai, kontaktai, plakatai ir vartotojai. Telefone ją galima įsidėti į pradžios ekraną.

Pirmą kartą atidarius sukuriama savininko paskyra. Savininkas gali pridėti kitus žmones (skiltis „Vartotojai“).

## Kaip veikia

- `functions/` – Cloudflare Pages Functions (API): `/api/content`, `/api/auth/*`, `/api/admin/*`, `/media/*`.
- `lib/` – bendras serverio kodas ir pradinis turinys (`lib/defaults.js`).
- Turinys, vartotojai ir įkeltos nuotraukos saugomi Cloudflare KV saugykloje, prijungtoje pavadinimu **GBK**.
- Svetainė (`site.js`) turinį paima iš `/api/content`. Jei API nepasiekiamas, rodomas HTML faile esantis turinys.

## Cloudflare nustatymai

1. Workers & Pages → Create → Pages → Connect to Git → ši repozitorija. Build command: tuščia, output directory: `/`.
2. KV saugykla `gbk` → projekto Settings → Bindings → KV namespace, kintamasis **GBK**.
3. Po pakeitimų – Deployments → Retry deployment.
