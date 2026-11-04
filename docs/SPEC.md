# StudyFlow — Especificação aprovada (v1.0)

Status: **aprovada** em 03/11/2026. Regras de negócio não devem ser alteradas sem aprovação.

## Objetivo
Aplicativo mobile (Android/iOS) de organização de estudos: matérias, tarefas, provas, prazos, avisos e Pomodoro. React Native/Expo com Firebase Authentication e Firestore.

## Autenticação
- Nome opcional, e-mail e senha obrigatórios (mínimo de 6 caracteres, com confirmação).
- Login imediato após cadastro, persistência de sessão, recuperação de senha por e-mail e logout.
- Sem verificação obrigatória de e-mail e sem exclusão de conta na versão inicial.
- Cada aluno acessa apenas seus próprios registros, por regras de segurança do Firebase.

## Matérias
- Nome obrigatório (até 60 caracteres), professor opcional (até 80), cor de identificação.
- CRUD; impedir nomes duplicados por conta, ignorando maiúsculas/minúsculas, acentos e espaços excedentes.
- Bloquear exclusão se houver tarefas ou provas vinculadas, inclusive no histórico.
- Permitir transferência individual de registros para outra matéria.

## Tarefas e provas
- Título obrigatório (até 120 caracteres), matéria e data obrigatórias; horário e descrição (até 1000 caracteres) opcionais.
- Lembrete individual configurável; títulos repetidos permitidos.
- Criar, consultar, editar, excluir definitivamente mediante confirmação.
- Datas passadas permitidas; todo novo registro inicia pendente.
- Tarefas são concluídas manualmente, provas marcadas como realizadas manualmente.
- Histórico preserva registros concluídos e realizados, permite editar e reabrir. Reabrir reativa lembrete futuro quando permitido.
- Sem horário: compromisso válido até 23:59:59 da data, atrasado a partir de 00:00 do dia seguinte (hora local). Com horário: vencido após horário indicado.
- Prazo vencido não implica conclusão automática. Sem classificação por prioridade.

## Dashboard e navegação
- Mostrar atrasados, tarefas de hoje, próximas provas e compromissos dentro de 7 dias (hoje e mais 6 dias).
- Atrasados primeiro; demais por prazo crescente.
- Tela Atividades com filtros Tudo / Tarefas / Provas e seção Histórico.
- Tema escuro moderno, navegação por abas e telas secundárias, UI responsiva com feedbacks claros.
- Sem calendário mensal e sem módulo separado de anotações/conteúdos.

## Notificações
- Lembrete padrão: 1 dia antes. Opções por registro: 3 dias, 1 dia, 1 hora ou desativado.
- Com horário cadastrado: exatamente 72 h, 24 h ou 1 h antes.
- Sem horário: avisos de 3 dias ou 1 dia antes às 09:00 locais; opção de 1 hora exige horário.
- Não criar notificações retroativas; avisar se o horário escolhido já passou.
- Alterar compromisso ou lembrete: cancelar notificação anterior e reagendar; excluir ou concluir: cancelar.
- Sem permissão, preservar preferências e seguir usando o app; ao conceder permissão, reagendar futuros ao abrir.
- Cada dispositivo autenticado agenda localmente e sincroniza com mudanças recebidas enquanto app ativo ou ao abrir.
- Aceitam-se avisos temporariamente desatualizados em aparelho fechado e sem sincronização.
- No logout cancelar lembretes da conta; no login reprogramar os futuros.

## Pomodoro
- Foco padrão 25 min (1–120), descanso padrão 5 min (1–60).
- Início manual de foco e descanso, sem transição automática.
- Iniciar, pausar, continuar e reiniciar. Reinício exige confirmação e volta ao tempo inicial, parado.
- Ajustes de duração só valem para sessões seguintes.
- Conclusão: vibração + feedback visual quando app aberto; notificação local quando em segundo plano (se permitida).
- Contagem por tempo real em segundo plano e após app fechado; restauração recalcula tempo restante. Sessão pausada mantém tempo.
- Sessão local distinta por usuário, persiste sem internet. Sem histórico de sessões ou estatísticas.

## Persistência e rede
- Firestore para matérias e tarefas/provas, com atualização em tempo real em aparelhos abertos.
- Internet obrigatória para visualizar/alterar dados acadêmicos; cronômetro funciona offline.
- Quando duas edições entram em conflito, prevalece a última gravação confirmada.
- Em erro ao salvar: manter formulário preenchido, informar falha e permitir tentar novamente.
- Não indicar sucesso antes da confirmação do salvamento; validar campos e proteger contra falhas.

## Entrega
- Repositório com `main`, `develop`, `feature/*`, commits distribuídos e PRs.
- README com screenshots, instalação, dependências, configuração Firebase e integrantes.
- Demonstração em emulador/dispositivo por vídeo de 3 a 5 minutos ou apresentação técnica.

## Aceitação
- Cadastro/login/logout/recuperação funcionam; isolamento entre contas é efetivo.
- Matérias, tarefas e provas obedecem todas as validações, vínculos e regras de exclusão.
- Atrasos, dashboard e histórico exibem dados corretos e reabrem registros.
- Notificações futuras podem ser programadas, reagendadas e canceladas conforme permissões e estado do dispositivo.
- Pomodoro é configurável, pausa, reinicia, continua em segundo plano e restaura após encerramento.
- Firebase sincroniza entre aparelhos online e trata falhas de rede sem perder formulários.
- Versão móvel documentada e demonstrável para avaliação acadêmica.

## Fase de validação
Não estão previstos testes automatizados como requisito da disciplina. A verificação funcional, de erros e limites será feita na execução em aparelhos compatíveis antes da entrega.
