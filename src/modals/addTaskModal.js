import { ActionRowBuilder, TextInputBuilder, TextInputStyle, ModalBuilder, EmbedBuilder } from 'discord.js';

// Affiche le modal pour ajouter une tâche
const showAddTaskModal = async (interaction) => {
  const modal = new ModalBuilder()
    .setCustomId('add_task_modal')
    .setTitle('Ajouter une tâche');

  const taskNameInput = new TextInputBuilder()
    .setCustomId('task_name')
    .setLabel('Nom de la tâche')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const taskDescriptionInput = new TextInputBuilder()
    .setCustomId('task_description')
    .setLabel('Description de la tâche')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false);

  const taskNumberInput = new TextInputBuilder()
    .setCustomId('task_number')
    .setLabel('Numéro de la tâche')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const firstActionRow = new ActionRowBuilder().addComponents(taskNameInput);
  const secondActionRow = new ActionRowBuilder().addComponents(taskDescriptionInput);
  const thirdActionRow = new ActionRowBuilder().addComponents(taskNumberInput);

  modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

  await interaction.showModal(modal);
};

// Gère la soumission du modal pour ajouter une tâche
const handleAddTaskModalSubmission = async (interaction, todosCollection) => {
  await interaction.deferReply({ ephemeral: true });

  const taskName = interaction.fields.getTextInputValue('task_name');
  const taskDescription = interaction.fields.getTextInputValue('task_description');
  const taskNumber = interaction.fields.getTextInputValue('task_number');

  try {
    const todo = await todosCollection.findOne({ channelId: interaction.channel.id });
    if (!todo) {
      return interaction.editReply({ content: 'Liste de tâches non trouvée.' });
    }

    const newTaskNumber = taskNumber ? parseInt(taskNumber, 10) : todo.tasks.length + 1;
    const newTask = {
      name: taskName,
      description: taskDescription,
      number: newTaskNumber,
      status: 'pending'
    };

    // Ajuster les numéros des tâches existantes
    todo.tasks.forEach(task => {
      if (task.number >= newTaskNumber) {
        task.number += 1;
      }
    });

    todo.tasks.push(newTask);
    todo.tasks.sort((a, b) => a.number - b.number);

    // Mettre à jour la base de données
    await todosCollection.updateOne(
      { channelId: interaction.channel.id },
      { $set: { tasks: todo.tasks } }
    );

    // Mettre à jour le message embed
    const message = await interaction.channel.messages.fetch(todo.messageId);
    const embed = new EmbedBuilder(message.embeds[0])
      .setDescription(generateTaskDescription(todo.tasks));

    await message.edit({ embeds: [embed] });

    await interaction.editReply({ content: 'Tâche ajoutée avec succès.' });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la tâche:', error);
    await interaction.editReply({ content: 'Erreur : Impossible d\'ajouter la tâche.' });
  }
};

// Génère la description de la liste des tâches
const generateTaskDescription = (tasks) => {
  return tasks
    .sort((a, b) => a.number - b.number)
    .map(task => `${task.number}. ${task.status === 'done' ? `~~${task.name}~~` : `${task.name}`} ${task.description ? `— *${task.description}*` : ''}`)
    .join('\n');
};

export { showAddTaskModal, handleAddTaskModalSubmission };
