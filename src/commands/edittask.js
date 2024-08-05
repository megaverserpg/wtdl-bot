import { EmbedBuilder, ChannelType } from 'discord.js';

const handleEditTask = async (interaction, todosCollection) => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  if (commandName === 'edittask') {
    const todoChannelId = options.getChannel('todo_channel').id;
    const taskNumber = options.getInteger('task_number');
    const newTaskName = options.getString('new_task_name');
    const newTaskDescription = options.getString('new_task_description');
    const newTaskNumber = options.getInteger('new_task_number');

    try {
      const todoChannel = await interaction.guild.channels.fetch(todoChannelId);
      if (!todoChannel || todoChannel.type !== ChannelType.GuildText) {
        return interaction.reply({ content: 'Erreur : Canal de liste de tâches non valide.', ephemeral: true });
      }

      const todo = await todosCollection.findOne({ channelId: todoChannelId });
      if (!todo) {
        return interaction.reply({ content: 'Erreur : Liste de tâches non trouvée.', ephemeral: true });
      }

      const taskIndex = todo.tasks.findIndex(task => task.number === taskNumber);
      if (taskIndex === -1) {
        return interaction.reply({ content: 'Erreur : Tâche non trouvée.', ephemeral: true });
      }

      // Mise à jour des détails de la tâche
      if (newTaskName) {
        todo.tasks[taskIndex].name = newTaskName;
      }
      if (newTaskDescription) {
        todo.tasks[taskIndex].description = newTaskDescription;
      }

      // Réindexer la tâche si le numéro a changé
      if (newTaskNumber && newTaskNumber !== taskNumber) {
        const [editedTask] = todo.tasks.splice(taskIndex, 1);
        editedTask.number = newTaskNumber;
        todo.tasks.splice(newTaskNumber - 1, 0, editedTask);
        // Réindexer les tâches restantes pour maintenir la séquence
        todo.tasks.forEach((task, index) => task.number = index + 1);
      }

      await todosCollection.updateOne(
        { channelId: todoChannelId },
        { $set: { tasks: todo.tasks } }
      );

      // Mettre à jour le message embed
      const messages = await todoChannel.messages.fetch();
      const embedMessage = messages.find(msg => msg.embeds.length > 0);

      const updatedDescription = todo.tasks
        .sort((a, b) => a.number - b.number)
        .map(task => `${task.number}. ${task.status === 'done' ? `~~${task.name}~~` : task.name} ${task.description ? `— *${task.description}*` : ''}`)
        .join('\n');

      const title = todo.name || 'To-Do List';

      const newEmbed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(updatedDescription)
        .setColor('#0099ff');

      if (embedMessage) {
        // Modifier l'embed existant
        const existingEmbed = embedMessage.embeds[0];
        const updatedEmbed = new EmbedBuilder(existingEmbed)
          .setTitle(title)
          .setDescription(updatedDescription);

        await embedMessage.edit({ embeds: [updatedEmbed] });
      } else {
        // Envoyer un nouvel embed si aucun existant
        await todoChannel.send({ embeds: [newEmbed] });
      }

      await interaction.reply({ content: 'Tâche modifiée avec succès.', ephemeral: true });
    } catch (error) {
      console.error('Erreur lors de la modification de la tâche:', error);
      await interaction.reply({ content: 'Erreur : Impossible de modifier la tâche.', ephemeral: true });
    }
  }
};

export { handleEditTask };
