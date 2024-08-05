import { EmbedBuilder, ChannelType } from 'discord.js';

const handleAddTask = async (interaction, todosCollection) => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  if (commandName === 'addtask') {
    // Réponse initiale rapide
    await interaction.reply({ content: 'Ajout de la tâche en cours...', ephemeral: true });

    const todoChannelId = options.getChannel('todo_channel').id;
    const taskName = options.getString('task_name');
    const taskNumber = options.getInteger('task_number') || null;
    const taskDescription = options.getString('description') || '';

    try {
      const todoChannel = await interaction.guild.channels.fetch(todoChannelId);
      if (!todoChannel || todoChannel.type !== ChannelType.GuildText) {
        return interaction.editReply({ content: 'Erreur : Canal de liste de tâches non valide.' });
      }

      // Récupérer la liste de tâches depuis la base de données
      const todo = await todosCollection.findOne({ channelId: todoChannelId });
      if (!todo) {
        return interaction.editReply({ content: 'Erreur : Liste de tâches non trouvée.' });
      }

      // Insérer ou ajouter la tâche
      if (taskNumber !== null) {
        todo.tasks.splice(taskNumber - 1, 0, {
          number: taskNumber,
          name: taskName,
          description: taskDescription,
          status: 'pending'
        });
      } else {
        const newNumber = todo.tasks.length ? Math.max(...todo.tasks.map(task => task.number)) + 1 : 1;
        todo.tasks.push({
          number: newNumber,
          name: taskName,
          description: taskDescription,
          status: 'pending'
        });
      }

      // Mettre à jour la base de données
      const updateResult = await todosCollection.updateOne(
        { channelId: todoChannelId },
        { $set: { tasks: todo.tasks } }
      );

      if (updateResult.modifiedCount === 0) {
        return interaction.editReply({ content: 'Erreur : Impossible d\'ajouter la tâche dans la base de données.' });
      }

      // Récupérer le message embed existant
      const messages = await todoChannel.messages.fetch();
      const embedMessage = messages.find(msg => msg.embeds.length > 0);

      if (!embedMessage) {
        return interaction.editReply({ content: 'Erreur : Message avec embed non trouvé dans le canal.' });
      }

      // Construire la nouvelle description
      let updatedDescription = '';
      todo.tasks
        .sort((a, b) => a.number - b.number)
        .forEach(task => {
          const taskText = `${task.number}. ${task.name} ${task.description ? `— *${task.description}*` : ''}`;
          updatedDescription += task.status === 'done' ? `~~${taskText}~~\n` : `${taskText}\n`;
        });

      const title = todo.name || 'To-Do List';

      // Créer un nouvel embed et mettre à jour le message
      const newEmbed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(updatedDescription)
        .setColor('#0099ff');

      await embedMessage.edit({ embeds: [newEmbed] });

      // Répondre avec succès
      await interaction.editReply({ content: 'Tâche ajoutée avec succès.' });
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la tâche:', error);
      await interaction.editReply({ content: 'Erreur : Impossible d\'ajouter la tâche.' });
    }
  }
};

export { handleAddTask };
