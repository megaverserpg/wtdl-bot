import { EmbedBuilder, ChannelType } from 'discord.js';

const handleUncrossTask = async (interaction, todosCollection) => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  if (commandName === 'uncrosstask') {
    const todoChannelId = options.getChannel('todo_channel').id;
    const taskNumber = options.getInteger('task_number');

    try {
      // Vérifier la validité du canal
      const todoChannel = await interaction.guild.channels.fetch(todoChannelId);
      if (!todoChannel || todoChannel.type !== ChannelType.GuildText) {
        return interaction.reply({ content: 'Erreur : Canal de liste de tâches non valide.', ephemeral: true });
      }

      // Trouver la liste de tâches dans la base de données
      const todo = await todosCollection.findOne({ channelId: todoChannelId });
      if (!todo) {
        return interaction.reply({ content: 'Erreur : Liste de tâches non trouvée.', ephemeral: true });
      }

      // Trouver et mettre à jour la tâche
      const taskIndex = todo.tasks.findIndex(task => task.number === taskNumber);
      if (taskIndex === -1) {
        return interaction.reply({ content: 'Erreur : Tâche non trouvée.', ephemeral: true });
      }

      // Réinitialiser le statut de la tâche et retirer le strikethrough
      todo.tasks[taskIndex].status = 'pending';
      todo.tasks[taskIndex].name = todo.tasks[taskIndex].name.replace(/~~(.*?)~~/, '$1');

      // Mettre à jour la base de données
      await todosCollection.updateOne(
        { channelId: todoChannelId },
        { $set: { tasks: todo.tasks } }
      );

      // Récupérer et mettre à jour le message embed
      const messages = await todoChannel.messages.fetch();
      const embedMessage = messages.find(msg => msg.embeds.length > 0);

      // Générer la description mise à jour
      const updatedDescription = generateTaskDescription(todo.tasks);

      const title = todo.name || 'To-Do List';

      if (embedMessage) {
        // Modifier l'embed existant
        const embed = embedMessage.embeds[0];
        const newEmbed = new EmbedBuilder(embed)
          .setTitle(title)
          .setDescription(updatedDescription);

        await embedMessage.edit({ embeds: [newEmbed] });
      } else {
        // Envoyer un nouvel embed s'il n'en existe pas
        const newEmbed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(updatedDescription)
          .setColor('#0099ff');

        await todoChannel.send({ embeds: [newEmbed] });
      }

      await interaction.reply({ content: 'Tâche marquée comme non terminée.', ephemeral: true });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la tâche :', error);
      await interaction.reply({ content: 'Erreur lors de la mise à jour de la tâche.', ephemeral: true });
    }
  }
};

// Fonction pour générer la description des tâches
const generateTaskDescription = (tasks) => {
  return tasks
    .sort((a, b) => a.number - b.number)
    .map(task => `${task.number}. ${task.status === 'done' ? `~~${task.name}~~` : task.name} ${task.description ? `— *${task.description}*` : ''}`)
    .join('\n');
};

export { handleUncrossTask };
