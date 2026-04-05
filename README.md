# FisioHome - Gestão de Consultas ao Domicílio

App web para fisioterapeutas gerirem consultas, pacientes e pagamentos.

## Estado atual do projeto

O projeto já deixou de ser um protótipo monolítico num único ficheiro e está agora organizado por módulos, com integração preparada para uso real com Firebase.

Neste momento a app já inclui:

- login com Firebase Authentication
- modo demo com dados locais
- persistência real em Firestore por utilizador autenticado
- dashboard com estatísticas
- calendário mensal
- gestão de pacientes
- gestão de consultas
- gestão de pagamentos
- eliminação de pacientes com confirmação
- eliminação de consultas com confirmação

## Estrutura atual

### Ficheiros principais

- `index.html`: estrutura da interface
- `styles.css`: estilos globais
- `firebase-config.js`: configuração do Firebase Web App
- `app.js`: entrypoint da aplicação
- `manifest.json`: manifesto da PWA

### Módulos JavaScript

- `js/state.js`: estado global da aplicação e referências Firebase
- `js/utils.js`: utilitários de datas, texto, moeda e ids
- `js/store.js`: camada de persistência (`localStorage` + Firestore)
- `js/ui.js`: helpers de UI, modais, navegação e toasts
- `js/auth.js`: autenticação e inicialização do Firebase

### Módulos por domínio

- `js/modules/dashboard.js`
- `js/modules/calendar.js`
- `js/modules/patients.js`
- `js/modules/appointments.js`
- `js/modules/payments.js`

## Como a persistência funciona

### Modo demo

Se o utilizador clicar em `Entrar como demo`, a app usa dados locais em `localStorage`.

### Modo real

Se o utilizador fizer login com Email/Password no Firebase Authentication, a app passa a usar Firestore.

Os dados são gravados por utilizador autenticado em:

- `users/{uid}/patients`
- `users/{uid}/appointments`

## Firebase

O ficheiro `firebase-config.js` já está preenchido com a configuração do projeto atual.

Para a autenticação funcionar corretamente, é preciso confirmar:

1. `Authentication > Sign-in method > Email/Password` está ativo
2. o utilizador existe em `Authentication > Users`
3. o domínio onde a app corre está autorizado em `Authentication > Settings > Authorized domains`

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

## Comportamento importante já implementado

### Pacientes

- criar paciente
- editar paciente
- ver detalhe do paciente
- eliminar paciente com confirmação
- ao eliminar um paciente, as consultas associadas também são eliminadas

### Consultas

- criar consulta
- editar consulta
- filtrar por estado
- eliminar consulta com confirmação

### Pagamentos

- registar pagamento
- ver valores pendentes
- ver histórico de pagamentos

### Login

- a app mostra agora mensagens de erro mais úteis no login Firebase
- por exemplo: domínio não autorizado, credenciais inválidas, método desativado, etc.

## Notas técnicas

- A navegação continua a ser SPA num único `index.html`
- A app já está separada por módulos, mas ainda usa `onclick` inline no HTML
- O botão de eliminar existe no detalhe do paciente e no modal de edição da consulta
- O estilo de ações destrutivas usa a classe `.btn-danger`

## Limitações atuais

- ainda não há service worker real para PWA offline
- ainda não há loading states dedicados por ecrã
- ainda não há rotas com URLs próprias
- ainda não foram removidos os `onclick` inline
- ainda não existe gestão de eliminação individual de pagamentos porque os pagamentos estão embutidos nas consultas

## Próximos passos recomendados

- remover `onclick` inline e passar para event listeners
- melhorar estados de loading e erro
- rever e corrigir todos os textos com problemas de encoding antigos
- adicionar service worker
- considerar separação adicional por componentes/UI helpers
- eventualmente introduzir rotas se a app crescer bastante
