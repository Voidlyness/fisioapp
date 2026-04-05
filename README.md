# FisioHome - Gestão de Consultas ao Domicílio

App web para fisioterapeutas gerirem consultas, pacientes e pagamentos.

## Estrutura

- `index.html`: estrutura da interface
- `styles.css`: estilos da app
- `app.js`: lógica, renderização e persistência
- `firebase-config.js`: configuração do Firebase
- `manifest.json`: manifesto da PWA

## Como usar

1. Abre `index.html` no browser.
2. Para testar rapidamente, entra em modo demo.
3. Para usar o Firebase real, usa o login com Email/Password do Firebase Auth.

## Firebase já ligado

O projeto está preparado para usar:

- Firestore em `users/{uid}/patients`
- Firestore em `users/{uid}/appointments`
- Firebase Auth para login

## Regras Firestore recomendadas

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Próximos passos

- remover `onclick` inline
- separar `app.js` por módulos
- adicionar loading states e tratamento de erro por ecrã
- completar PWA com service worker
