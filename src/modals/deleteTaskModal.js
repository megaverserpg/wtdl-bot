import { ActionRowBuilder, TextInputBuilder, TextInputStyle, ModalBuilder, EmbedBuilder } from 'discord.js';

// Fonction pour afficher la modale de suppression de tâche
const showDeleteTaskModal = async (interaction) => {
  const modal = new ModalBuilder()
    .setCustomId('delete_task_modal')
    .setTitle('Supprimer une tâche');

  const taskNumberInput = new TextInputBuilder()
    .setCustomId('task_number')
    .setLabel('Numéro de la tâche')
    .setStyle(TextInputStyle.Short)
    .setRequired(true); // Assurez-vous que l'entrée est obligatoire

  const firstActionRow = new ActionRowBuilder().addComponents(taskNumberInput);

  modal.addComponents(firstActionRow);

  await interaction.showModal(modal);
};

// Fonction pour gérer la soumission de la modale de suppression de tâche
const handleDeleteTaskModalSubmission = async (interaction, todosCollection) => {
  const taskNumber = parseInt(interaction.fields.getTextInputValue('task_number'), 10);

  try {
    // Trouver la liste de tâches depuis la base de données
    const todo = await todosCollection.findOne({ channelId: interaction.channel.id });
    if (!todo) {
      await interaction.reply({ content: 'Liste de tâches non trouvée.', ephemeral: true });
      return;
    }

    // Trouver et supprimer la tâche
    const taskIndex = todo.tasks.findIndex(task => task.number === taskNumber);
    if (taskIndex === -1) {
      await interaction.reply({ content: 'Tâche non trouvée.', ephemeral: true });
      return;
    }

    // Supprimer la tâche de la liste
    todo.tasks.splice(taskIndex, 1);

    // Réindexer les tâches restantes
    todo.tasks.forEach((task, index) => {
      task.number = index + 1;
    });

    // Mettre à jour la base de données
    await todosCollection.updateOne(
      { channelId: interaction.channel.id },
      { $set: { tasks: todo.tasks } }
    );

    // Générer la nouvelle description des tâches
    const newDescription = generateTaskDescription(todo.tasks);

    // Mettre à jour le message embed
    const message = await interaction.channel.messages.fetch(todo.messageId);
    const embed = new EmbedBuilder(message.embeds[0])
      .setDescription(newDescription.length > 0 ? newDescription : 'Aucune tâche disponible.');

    await message.edit({ embeds: [embed] });

    await interaction.reply({ content: 'Tâche supprimée avec succès.', ephemeral: true });
  } catch (error) {
    console.error('Erreur lors de la suppression de la tâche :', error);
    await interaction.reply({ content: 'Erreur : Impossible de supprimer la tâche.', ephemeral: true });
  }
};

// Fonction pour générer la description des tâches à partir des tâches
const generateTaskDescription = (tasks) => {
  return tasks
    .sort((a, b) => a.number - b.number)
    .map(task => `${task.number}. ${task.status === 'done' ? `~~${task.name}~~` : task.name} ${task.description ? `— *${task.description}*` : ''}`)
    .join('\n');
};

export { showDeleteTaskModal, handleDeleteTaskModalSubmission };