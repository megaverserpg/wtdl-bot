import { ActionRowBuilder, TextInputBuilder, TextInputStyle, ModalBuilder, EmbedBuilder } from 'discord.js';

// Fonction pour afficher la modale pour débarrer une tâche
const showUncrossTaskModal = async (interaction) => {
  const modal = new ModalBuilder()
    .setCustomId('uncross_task_modal')
    .setTitle('Débarrer une tâche non terminée');

  const taskNumberInput = new TextInputBuilder()
    .setCustomId('task_number')
    .setLabel('Numéro de la tâche à débarrer')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const firstActionRow = new ActionRowBuilder().addComponents(taskNumberInput);

  modal.addComponents(firstActionRow);

  await interaction.showModal(modal);
};

// Fonction pour gérer la soumission de la modale de débarage de tâche
const handleUncrossTaskModalSubmission = async (interaction, todosCollection) => {
  const taskNumber = parseInt(interaction.fields.getTextInputValue('task_number'), 10);

  try {
    // Récupérer la liste de tâches depuis la base de données
    const todo = await todosCollection.findOne({ channelId: interaction.channel.id });
    if (!todo) {
      return interaction.reply({ content: 'Liste de tâches non trouvée.', ephemeral: true });
    }

    // Trouver la tâche à débarrer
    const taskIndex = todo.tasks.findIndex(task => task.number === taskNumber);
    if (taskIndex === -1) {
      return interaction.reply({ content: 'Tâche non trouvée.', ephemeral: true });
    }

    // Vérifier si la tâche est barrée avant de la dé-barrer
    if (todo.tasks[taskIndex].status !== 'done') {
      return interaction.reply({ content: 'La tâche n\'est pas barrée.', ephemeral: true });
    }

    // Dé-barrer la tâche
    todo.tasks[taskIndex].status = 'pending';
    todo.tasks[taskIndex].name = todo.tasks[taskIndex].name.replace(/~~(.*?)~~/, '$1');

    // Mettre à jour la base de données
    await todosCollection.updateOne(
      { channelId: interaction.channel.id },
      { $set: { tasks: todo.tasks } }
    );

    // Mettre à jour l'embed du message
    const message = await interaction.channel.messages.fetch(todo.messageId);
    const embed = new EmbedBuilder(message.embeds[0])
      .setDescription(generateTaskDescription(todo.tasks));

    await message.edit({ embeds: [embed] });

    await interaction.reply({ content: 'Tâche marquée en cours avec succès.', ephemeral: true });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la tâche :', error);
    await interaction.reply({ content: 'Erreur lors de la mise à jour de la tâche.', ephemeral: true });
  }
};

// Fonction pour générer la description des tâches à partir des tâches
const generateTaskDescription = (tasks) => {
  return tasks
    .sort((a, b) => a.number - b.number)
    .map(task => `${task.number}. ${task.status === 'done' ? `~~${task.name}~~` : task.name} ${task.description ? `— *${task.description}*` : ''}`)
    .join('\n');
};

export { showUncrossTaskModal, handleUncrossTaskModalSubmission };
