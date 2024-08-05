import { ActionRowBuilder, TextInputBuilder, TextInputStyle, ModalBuilder, EmbedBuilder } from 'discord.js';

// Fonction pour afficher la modale pour rayer une tâche
const showCrossTaskModal = async (interaction) => {
  const modal = new ModalBuilder()
    .setCustomId('cross_task_modal')
    .setTitle('Barrer une tâche terminée');

  const taskNumberInput = new TextInputBuilder()
    .setCustomId('task_number')
    .setLabel('Numéro de la tâche à rayer')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const firstActionRow = new ActionRowBuilder().addComponents(taskNumberInput);

  modal.addComponents(firstActionRow);

  await interaction.showModal(modal);
};

// Fonction pour gérer la soumission de la modale de rayage de tâche
const handleCrossTaskModalSubmission = async (interaction, todosCollection) => {
  const taskNumber = parseInt(interaction.fields.getTextInputValue('task_number'), 10);

  try {
    const todo = await todosCollection.findOne({ channelId: interaction.channel.id });
    if (!todo) {
      await interaction.reply({ content: 'Liste de tâches non trouvée.', ephemeral: true });
      return;
    }

    // Trouver et mettre à jour la tâche
    const taskIndex = todo.tasks.findIndex(task => task.number === taskNumber);
    if (taskIndex === -1) {
      await interaction.reply({ content: 'Tâche non trouvée.', ephemeral: true });
      return;
    }

    // Rayé la tâche en mettant à jour son statut
    todo.tasks[taskIndex].status = 'done';

    // Mettre à jour la base de données en une seule opération
    await todosCollection.updateOne(
      { channelId: interaction.channel.id, 'tasks.number': taskNumber },
      { $set: { 'tasks.$.status': 'done' } }
    );

    // Récupérer le message embed et le mettre à jour
    const message = await interaction.channel.messages.fetch(todo.messageId);
    const embed = new EmbedBuilder(message.embeds[0])
      .setDescription(generateTaskDescription(todo.tasks));

    await message.edit({ embeds: [embed] });

    await interaction.reply({ content: 'Tâche rayée avec succès.', ephemeral: true });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la tâche :', error);
    await interaction.reply({ content: 'Erreur lors de la mise à jour de la tâche.', ephemeral: true });
  }
};

// Fonction pour générer la description des tâches à partir des tâches
const generateTaskDescription = (tasks) => {
  return tasks
    .sort((a, b) => a.number - b.number)
    .map(task => `${task.number}. ${task.status === 'done' ? `~~${task.name}~~` : `${task.name}`} ${task.description ? `— *${task.description}*` : ''}`)
    .join('\n');
};

export { showCrossTaskModal, handleCrossTaskModalSubmission };
