name: Proposta / Feature request
description: Suggerisci un miglioramento o una nuova funzionalità
labels: ["enhancement"]
body:
  - type: textarea
    id: problem
    attributes:
      label: Problema / Problem
      description: Quale problema pratico della gestione casa risolve questa proposta?
    validations:
      required: true
  - type: textarea
    id: solution
    attributes:
      label: Soluzione proposta / Proposed solution
      description: Come dovrebbe funzionare secondo te
    validations:
      required: true
