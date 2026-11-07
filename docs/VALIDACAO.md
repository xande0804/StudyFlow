# Validação do StudyFlow

SPEC v1.0 com recuperação de senha removida por decisão do usuário. Registro atualizado em 05/11/2026. As verificações pontuais de código e SDK complementam a validação manual. O projeto permanece sem suíte automatizada.

## Confirmado no navegador

- [x] Cadastro, login, saída e restauração da sessão.
- [x] Campos inválidos exibem feedback e preservam o formulário. Data 30/02 foi rejeitada e o título continuou preenchido.
- [x] Matérias com nome normalizado, edição e cores.
- [x] Tarefas e provas com edição em modal, detalhes, filtros, histórico, conclusão e reabertura.
- [x] Transferência entre matérias e atualização em tempo real entre duas abas.
- [x] Painel separa atraso, hoje e compromissos futuros. Prova futura aparece na seção de provas.
- [x] Pomodoro configura duração, pausa, retoma e restaura a sessão ao recarregar. Foco acima de 120 minutos é rejeitado.

## Confirmado com o SDK real e regras publicadas

As operações usaram contas fictícias de revisão separadas dos dados do aluno. Os registros criados pela última rodada foram excluídos ao final dos cenários.

- [x] Nome duplicado com variações de caixa, espaços e acentos é rejeitado.
- [x] Dois cadastros simultâneos do mesmo nome resultam em apenas uma matéria.
- [x] Data impossível é rejeitada antes da gravação.
- [x] Exclusão direta de matéria com atividades é negada pelo Firestore.
- [x] Tentativa de adulterar a lista de vínculos é negada pelo Firestore.
- [x] Um vínculo apenas no histórico continua bloqueando a exclusão.
- [x] Transferência de prova histórica preserva o estado de realizada.
- [x] Reabrir, excluir a atividade e depois excluir a matéria sem vínculos funciona.
- [x] Conta autenticada não consegue ler nem gravar nos dados de outra conta.
- [x] Acesso sem autenticação é negado.
- [x] Com a rede do SDK desligada, salvar falha e a consulta após reconectar confirma ausência de gravação.
- [x] Lembrete sem horário resulta em 09h local do dia anterior. Intervalos com horário usam 72h ou 1h exatas.
- [x] Prazo sem hora termina às 23:59:59.999, ficando atrasado à meia-noite seguinte. Prazo com hora considera o instante indicado. A janela de sete dias atravessa corretamente a mudança de mês.
- [x] Sessões salvas inválidas do Pomodoro são rejeitadas. Estados válidos pausados e em andamento são restaurados.

As matérias anteriores receberam metadados de vínculos por manutenção administrativa, preservando documentos, nomes, atividades e respectivos estados. As regras exigem que a mudança desses vínculos ocorra na mesma transação da criação, transferência ou exclusão de atividades.

## Confirmado pelo usuário no Android 16

- [x] App próprio compilado e instalado no emulador. Login funciona.
- [x] Permissão de notificações e acesso a Alarmes e lembretes concedidos.
- [x] Pomodoro de um minuto entrega aviso sonoro e visual em segundo plano.
- [x] Pausar o Pomodoro cancela o aviso.
- [x] Lembretes de tarefa e prova chegam com a conta logada.
- [x] Logout cancela lembretes de tarefa e prova.
- [x] Concluir atividade cancela o lembrete.
- [x] Editar prazo substitui o aviso e reabrir reagenda um aviso futuro.
- [x] Revogar e restaurar a permissão de notificações funciona.

## Pendências de execução

- [ ] Encerrar completamente o app Android e reabrir durante o Pomodoro, inclusive offline e em outra conta.
- [ ] Vibração em aparelho físico.
- [ ] Execução em iOS.
- [ ] Simular queda da conexão durante o envio pela interface. O bloqueio da gravação sem rede foi confirmado no SDK, e a preservação do formulário foi confirmada em erro de validação.

## Entrega

- [ ] Revisar a interface em telas pequenas, com teclado aberto, incluindo ícones e acessibilidade.
- [ ] Repetir os fluxos afetados pela revisão visual.
- [ ] Finalizar README com integrantes, divisão de tarefas, Firebase, instalação e capturas reais.
- [ ] Conferir postagem da proposta e os prazos no Classroom, que estão em aberto no PDF.
- [ ] Preparar vídeo de 3 a 5 minutos ou apresentação com app em execução.
- [ ] Revisar PR antes do merge em develop e preparar a versão estável em main.

## Revisão visual em 05/11/2026

- Componentes de botão padronizados, com seleção explícita, estados de pressionado e desabilitado.
- Painel com indicadores acadêmicos e cartões responsivos, conferido no navegador em largura de 390px.
- Pomodoro com modo escolhido destacado, relógio central e progresso. Início, pausa e reinício conferidos após a troca dos botões.
- Ícones das abas carregados no navegador. Modais de atividades mantêm seleção de tipo, matéria e lembrete.
- Usuário confirmou que sair da conta cancela também o aviso do Pomodoro.
- Ainda é necessária a revisão do visual no Android após sincronização. iOS e vibração física permanecem pendentes.
