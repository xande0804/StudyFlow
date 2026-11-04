# Validação manual — SPEC v1.0

Execute em Android e iOS. Para sincronização, use dois dispositivos conectados à mesma conta. Registre dispositivo, versão do app, resultado e evidência de cada verificação. Todos os itens estão pendentes de execução. A lista foi conferida com o enunciado Projeto Final.pdf. Firebase Auth é opcional na disciplina e obrigatório na SPEC v1.0.

- [ ] Interface escura e legível com teclado aberto e em tela pequena. Componentes reaproveitados, layout Flexbox, ícones identificáveis e feedback de carregamento, vazio e erro.
- [ ] Navegue entre abas e telas secundárias. Volte sem perder o estado esperado. Confira campos locais e sessão global compartilhada.
- [ ] Cadastre com e sem nome. Rejeite e-mail inválido, senha curta e confirmação divergente. Confira login imediato, persistência após reinício e saída.
- [ ] Crie, edite e exclua matérias. Confira os limites de nome e professor e a cor. Tente duplicar nomes com variações de espaços, acentos e caixa.
- [ ] Crie e edite tarefas e provas com títulos repetidos e prazos passados. Confira campos obrigatórios, limites e confirmação de exclusão. Transfira registros entre matérias. Tente excluir matéria vinculada inclusive a registros históricos.
- [ ] Confira filtros, histórico, conclusão manual e reabertura. Teste o atraso após o horário marcado e à meia-noite para data sem horário. Compare a ordem do dashboard e os limites da janela de sete dias.
- [ ] Teste lembretes de três dias, um dia, uma hora e desativado. Confira 09h local sem horário, bloqueio de uma hora sem horário e aviso sobre lembrete passado. Edite, conclua, reabra e exclua. Revogue e restaure a permissão e confira o reagendamento ao abrir. Saia e entre novamente.
- [ ] Teste foco e descanso, limites de duração, pausa, retomada e confirmação de reinício. Confira que mudanças valem para as sessões seguintes. Feche e reabra o app. Verifique vibração em primeiro plano, notificação em segundo plano e funcionamento offline.
- [ ] Compare sessões de Pomodoro de duas contas. Confira isolamento dos dados do Firestore. Em dois dispositivos na mesma conta, confira atualização em tempo real, último salvamento confirmado e perda de conexão durante um formulário.
- [ ] Confira branches, commits e revisão dos PRs antes do merge em develop. Execute a instalação pelo README em uma cópia limpa. Confira integrantes, divisão de tarefas, capturas reais e vídeo de 3 a 5 minutos ou apresentação.

## Entrega no Classroom

- [ ] Confira a postagem da proposta com nome completo dos integrantes, nome do app, problema, público-alvo, funcionalidades e link do repositório.
- [ ] Na tarefa final, inclua o link do repositório público ou com acesso liberado ao professor. O PDF deixa as datas em aberto. Confira os prazos no Classroom.

## Evidências da entrega

O padrão adotado nas entregas do Gerenciador de Despesas 2.0 e do CampusGo será aplicado ao StudyFlow. Salve capturas reais com nomes descritivos em `prints/` e confira os links no README e na descrição do PR. Mostre pelo menos o fluxo principal, um formulário inválido, o tratamento da permissão de notificações e a recuperação após perda de conexão. Identifique a plataforma usada para cada evidência e registre os casos ainda pendentes. Inclua identificação acadêmica, divisão de tarefas e passos de instalação no README.

## Referência da disciplina para Firebase

Use o SDK JavaScript modular do Firebase com o Expo e centralize a inicialização em `src/firebaseConnection.ts`. Compartilhe a sessão via Context acima da navegação. Use `onSnapshot` com limpeza da inscrição ao sair da conta, mapeie documentos antes de exibi-los e aguarde a confirmação das gravações antes de fechar o formulário. Para o StudyFlow, use o UID autenticado e regras por usuário. O UID fixo do exemplo de despesas é um recurso didático. O Expo mantém a configuração padrão do Metro.

## Validação no Android

- Pomodoro em segundo plano: no emulador Android 16 com a build de desenvolvimento, foi iniciada uma sessão de foco de 1 minuto. Ao sair da tela do app, o aviso de conclusão apareceu na barra de notificações e tocou um som.
- Para reproduzir, habilite notificações na aba Conta e permita Alarmes e lembretes para o StudyFlow nas configurações do Android. Inicie uma nova sessão depois de conceder a permissão.
- Ainda faltam os testes de entrega de lembretes de tarefas e provas, cancelamento ao concluir uma atividade e vibração em aparelho físico.

- Lembrete de atividade no emulador Android 16: com a sessão ativa e o app em segundo plano, o aviso de uma hora antes foi entregue. Em novo teste com aviso futuro e logout antes do disparo, o aviso não apareceu após o horário previsto.
- Pomodoro pausado no emulador Android 16: o aviso não tocou após a pausa, conforme confirmado no teste manual.
