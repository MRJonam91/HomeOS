name: Segnalazione bug / Bug report
description: Segnala un malfunzionamento o comportamento inatteso
labels: ["bug"]
body:
  - type: textarea
    id: description
    attributes:
      label: Descrizione / Description
      description: Cosa è successo e cosa ti aspettavi / What happened vs expected
    validations:
      required: true
  - type: textarea
    id: reproduction
    attributes:
      label: Passi per riprodurre / Steps to reproduce
      description: Comandi eseguiti o dati di input usati
    validations:
      required: true
  - type: input
    id: environment
    attributes:
      label: Ambiente / Environment
      description: Node.js version, OS (Linux, macOS, Windows)
