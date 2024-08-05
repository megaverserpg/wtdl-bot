import { EmbedBuilder, ChannelType } from 'discord.js';

const handleDeleteTask = async (interaction, todosCollection) => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  if (commandName === 'deletetask') {
    const todoChannelId = options.getChannel('todo_channel').id;
    const taskNumber = options.getInteger('task_number');

    try {
      // Vérifier le canal
      const todoChannel = await interaction.guild.channels.fetch(todoChannelId);
      if (!todoChannel || todoChannel.type !== ChannelType.GuildText) {
        return interaction.reply({ content: 'Erreur : Canal de liste de tâches non valide.', ephemeral: true });
      }

      // Récupérer la liste de tâches depuis la base de données
      const todo = await todosCollection.findOne({ channelId: todoChannelId });
      if (!todo) {
        return interaction.reply({ content: 'Erreur : Liste de tâches non trouvée.', ephemeral: true });
      }

      // Trouver et supprimer la tâche
      const taskIndex = todo.tasks.findIndex(task => task.number === taskNumber);
      if (taskIndex === -1) {
        return interaction.reply({ content: 'Erreur : Tâche non trouvée.', ephemeral: true });
      }

      todo.tasks.splice(taskIndex, 1);

      // Réindexer les tâches restantes
      todo.tasks.forEach((task, index) => {
        task.number = index + 1;
      });

      // Mettre à jour la base de données
      await todosCollection.updateOne(
        { channelId: todoChannelId },
        { $set: { tasks: todo.tasks } }
      );

      // Construire la description mise à jour pour l'embed
      const updatedDescription = todo.tasks
        .map(task => {
          const taskName = task.status === 'done' ? `~~${task.name}~~` : task.name;
          return `${task.number}. ${taskName} ${task.description ? `— *${task.description}*` : ''}`;
        })
        .join('\n');

      const embed = new EmbedBuilder()
        .setTitle(todo.name || 'What To-Do Next')
        .setColor(0x00AE86)
        .setDescription(updatedDescription || 'Aucune tâche');

      // Chercher les messages et trouver l'embed à éditer
      const messages = await todoChannel.messages.fetch();
      const embedMessage = messages.find(msg => msg.embeds.length > 0);

      if (embedMessage) {
        // Modifier l'embed existant
        const existingEmbed = embedMessage.embeds[0];
        const newEmbed = new EmbedBuilder(existingEmbed)
          .setTitle(todo.name || 'What To-Do Next')
          .setDescription(updatedDescription || 'Aucune tâche');

        await embedMessage.edit({ embeds: [newEmbed] });
      } else {
        // Envoyer un nouvel embed si aucun n'est trouvé
        await todoChannel.send({ embeds: [embed] });
      }

      await interaction.reply({ content: 'Tâche supprimée avec succès.', ephemeral: true });
    } catch (error) {
      console.error('Erreur lors de la suppression de la tâche :', error);
      await interaction.reply({ content: 'Erreur : Impossible de supprimer la tâche.', ephemeral: true });
    }
  }
};

export { handleDeleteTask };
