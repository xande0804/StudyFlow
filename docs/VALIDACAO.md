# Validação manual — SPEC v1.0

Execute em Android e iOS. Para sincronização, use dois dispositivos conectados à mesma conta. Registre dispositivo, versão do app, resultado e evidência de cada verificação. Todos os itens estão pendentes de execução. A lista foi conferida com o enunciado Projeto Final.pdf. Firebase Auth é opcional na disciplina e obrigatório na SPEC v1.0.

- [ ] Interface escura e legível com teclado aberto e em tela pequena. Componentes reaproveitados, layout Flexbox, ícones identificáveis e feedback de carregamento, vazio e erro.
- [ ] Navegue entre abas e telas secundárias. Volte sem perder o estado esperado. Confira campos locais e sessão global compartilhada.
- [ ] Cadastre com e sem nome. Rejeite e-mail inválido, senha curta e confirmação divergente. Confira login imediato, persistência após reinício, recuperação por e-mail e saída.
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
