# HomeOS: decision seed & MVP status

IT — Scopo: Documenti, manutenzioni, consumi e inventario della casa non sono collegati. Prima prova: Inventario locale di una stanza con manuali, garanzie e interventi programmati.

EN — Purpose: Home documents, maintenance, consumption and inventory are disconnected. First trial: Local inventory of one room with manuals, warranties and planned maintenance.

## Decisioni prese / Resolved decisions (2026-11-06)

- **Caso pilota e dataset sintetico**: Implementata la stanza pilota "Cucina Principale" con 5 categorie di apparati (pompa di calore ACS, piano induzione, lavastoviglie, frigorifero smart, rilevatore sicurezza fumo/CO), libretti e manutenzioni verificate.
- **Nome e confini**: Confermato nome `HomeOS`. Confini formalizzati in `docs/ARCHITECTURE.md` (separazione tra gestione logistica/dossier e diagnosi termotecnica/strutturale demandata a professionisti abilitati).
- **Misura di successo osservabile**: Esportazione automatica deterministica del Fascicolo/Dossier Stanza bilingue (`homeos dossier`), scadenziario manutenzioni preventivo con stima costi (`homeos schedule`), e audit di integrità dati tripartito (fatti accertati, stime, decisioni umane).
- **Standard repo MRJonam91**: Applicato integralmente `../_repo-kit/REPO-STANDARDS.md`:
  - Licenza AGPL-3.0-only + licenza commerciale (`COMMERCIAL-LICENSE.md`) + CLA (`CLA.md`)
  - Canali di donazione in `.github/FUNDING.yml` e blocchi sponsor nei README e CLI
  - CI con controllo statico dei tipi, test suite completa e guardia core < 1.500 LOC
  - Registri di conformità e integrità licenza verificati
  - Repository GitHub ufficiale creata su `MRJonam91/HomeOS`
