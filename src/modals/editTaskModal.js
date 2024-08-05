import { ActionRowBuilder, StringSelectMenuBuilder, TextInputBuilder, TextInputStyle, ModalBuilder, EmbedBuilder } from 'discord.js';

// Fonction pour afficher le menu déroulant pour choisir la tâche à éditer
const showTaskSelectMenu = async (interaction, todosCollection) => {
  // Récupérer la liste des tâches depuis la base de données
  const todo = await todosCollection.findOne({ channelId: interaction.channel.id });
  if (!todo) {
    await interaction.reply({ content: 'Liste de tâches non trouvée.', ephemeral: true });
    return;
  }

  const tasks = todo.tasks;
  const options = tasks.map(task => ({
    label: `Tâche ${task.number}: ${task.name}`,
    value: task.number.toString(),
  }));

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('task_select_menu')
    .setPlaceholder('Choisissez une tâche à éditer')
    .addOptions(options);

  const row = new ActionRowBuilder().addComponents(selectMenu);

  await interaction.reply({ content: 'Sélectionnez une tâche à éditer:', components: [row], ephemeral: true });
};

// Fonction pour afficher la modale pour éditer une tâche
const showEditTaskModal = async (interaction, taskData) => {
  const modal = new ModalBuilder()
    .setCustomId('edit_task_modal')
    .setTitle('Modifier une tâche');

  // Champ pour le numéro actuel de la tâche
  const currentTaskNumberInput = new TextInputBuilder()
    .setCustomId('current_task_number')
    .setLabel('Numéro actuel de la tâche')
    .setStyle(TextInputStyle.Short)
    .setValue(taskData.number.toString())
    .setRequired(true); // Ce champ est requis

  const newTaskNameInput = new TextInputBuilder()
    .setCustomId('new_task_name')
    .setLabel('Nouveau nom de la tâche')
    .setStyle(TextInputStyle.Short)
    .setValue(taskData.name);

  const newTaskDescriptionInput = new TextInputBuilder()
    .setCustomId('new_task_description')
    .setLabel('Nouvelle description de la tâche')
    .setStyle(TextInputStyle.Paragraph)
    .setValue(taskData.description || '');

  const newTaskNumberInput = new TextInputBuilder()
    .setCustomId('new_task_number')
    .setLabel('Nouveau numéro de la tâche')
    .setStyle(TextInputStyle.Short)
    .setValue(taskData.number.toString());

  const firstActionRow = new ActionRowBuilder().addComponents(currentTaskNumberInput);
  const secondActionRow = new ActionRowBuilder().addComponents(newTaskNameInput);
  const thirdActionRow = new ActionRowBuilder().addComponents(newTaskDescriptionInput);
  const fourthActionRow = new ActionRowBuilder().addComponents(newTaskNumberInput);

  modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow);

  await interaction.showModal(modal);
};

// Fonction pour gérer la soumission du menu déroulant pour choisir une tâche
const handleTaskSelectMenu = async (interaction, todosCollection) => {
  const taskNumber = parseInt(interaction.values[0], 10);

  // Récupérer la liste des tâches depuis la base de données
  const todo = await todosCollection.findOne({ channelId: interaction.channel.id });
  if (!todo) {
    await interaction.reply({ content: 'Liste de tâches non trouvée.', ephemeral: true });
    return;
  }

  // Trouver la tâche sélectionnée
  const task = todo.tasks.find(task => task.number === taskNumber);
  if (!task) {
    await interaction.reply({ content: 'Tâche non trouvée.', ephemeral: true });
    return;
  }

  await showEditTaskModal(interaction, task);
};

// Fonction pour gérer la soumission de la modale d'édition de tâche
const handleEditTaskModalSubmission = async (interaction, todosCollection) => {
  try {
    const currentTaskNumber = parseInt(interaction.fields.getTextInputValue('current_task_number'), 10);
    const newTaskName = interaction.fields.getTextInputValue('new_task_name') || null;
    const newTaskDescription = interaction.fields.getTextInputValue('new_task_description') || null;
    const newTaskNumber = interaction.fields.getTextInputValue('new_task_number') ? parseInt(interaction.fields.getTextInputValue('new_task_number'), 10) : null;

    // Trouver la liste des tâches pour le canal spécifié
    const todo = await todosCollection.findOne({ channelId: interaction.channel.id });

    if (!todo) {
      await interaction.reply({ content: 'Liste de tâches non trouvée.', ephemeral: true });
      return;
    }

    // Trouver la tâche spécifique à modifier
    const taskIndex = todo.tasks.findIndex(task => task.number === currentTaskNumber);
    if (taskIndex === -1) {
      await interaction.reply({ content: 'Tâche non trouvée.', ephemeral: true });
      return;
    }

    const task = todo.tasks[taskIndex];

    // Mettre à jour les informations de la tâche
    if (newTaskName) task.name = newTaskName;
    if (newTaskDescription) task.description = newTaskDescription;

    // Réindexer les tâches si le numéro de tâche change
    if (newTaskNumber && newTaskNumber !== currentTaskNumber) {
      // Supprimer la tâche modifiée
      todo.tasks = todo.tasks.filter(task => task.number !== currentTaskNumber);

      // Réindexer les tâches existantes
      todo.tasks.forEach(task => {
        if (task.number >= newTaskNumber) {
          task.number += 1;
        }
      });

      // Insérer la tâche modifiée au bon endroit
      task.number = newTaskNumber;
      todo.tasks.push(task);
      todo.tasks.sort((a, b) => a.number - b.number);
    }

    // Mettre à jour le document dans la base de données
    await todosCollection.updateOne(
      { channelId: interaction.channel.id },
      { $set: { tasks: todo.tasks } }
    );

    // Mettre à jour le message embed
    const message = await interaction.channel.messages.fetch(todo.messageId);
    const embed = new EmbedBuilder(message.embeds[0])
      .setDescription(generateTaskDescription(todo.tasks));

    await message.edit({ embeds: [embed] });

    await interaction.reply({ content: 'Tâche modifiée avec succès.', ephemeral: true });
  } catch (error) {
    console.error('Erreur lors de la modification de la tâche :', error);
    await interaction.reply({ content: 'Erreur : Impossible de modifier la tâche.', ephemeral: true });
  }
};

// Fonction pour générer la description des tâches à partir des tâches
const generateTaskDescription = (tasks) => {
  return tasks
    .sort((a, b) => a.number - b.number)
    .map(task => `${task.number}. ${task.status === 'done' ? `~~${task.name}~~` : task.name} ${task.description ? `— *${task.description}*` : ''}`)
    .join('\n');
};

export { showTaskSelectMenu, handleTaskSelectMenu, handleEditTaskModalSubmission };
