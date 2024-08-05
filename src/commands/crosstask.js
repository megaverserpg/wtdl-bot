import { EmbedBuilder, ChannelType } from 'discord.js';

const handleCrossTask = async (interaction, todosCollection) => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  if (commandName !== 'crosstask') return;

  const todoChannelId = options.getChannel('todo_channel').id;
  const taskNumber = options.getInteger('task_number');

  try {
    // Vérifier le type du canal
    const todoChannel = await interaction.guild.channels.fetch(todoChannelId);
    if (!todoChannel || todoChannel.type !== ChannelType.GuildText) {
      return interaction.reply({ content: 'Erreur : Canal de liste de tâches non valide.', ephemeral: true });
    }

    // Récupérer et mettre à jour la tâche
    const todo = await todosCollection.findOneAndUpdate(
      { channelId: todoChannelId, 'tasks.number': taskNumber },
      { $set: { 'tasks.$.status': 'done' } },
      { returnDocument: 'after' }
    );

    if (!todo.value) {
      return interaction.reply({ content: 'Erreur : Liste de tâches ou tâche non trouvée.', ephemeral: true });
    }

    // Construire la description mise à jour
    const updatedDescription = generateTaskDescription(todo.value.tasks);

    // Mettre à jour ou envoyer le message embed
    const messages = await todoChannel.messages.fetch();
    const embedMessage = messages.find(msg => msg.embeds.length > 0);

    if (embedMessage) {
      const embed = new EmbedBuilder(embedMessage.embeds[0])
        .setDescription(updatedDescription);

      await embedMessage.edit({ embeds: [embed] });
    } else {
      const newEmbed = new EmbedBuilder()
        .setTitle(todo.value.name || 'To-Do List')
        .setDescription(updatedDescription)
        .setColor('#0099ff');

      await todoChannel.send({ embeds: [newEmbed] });
    }

    await interaction.reply({ content: 'Tâche marquée comme terminée.', ephemeral: true });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la tâche :', error);
    await interaction.reply({ content: 'Erreur lors de la mise à jour de la tâche.', ephemeral: true });
  }
};

// Génère la description de la liste des tâches
const generateTaskDescription = (tasks) => {
  return tasks
    .sort((a, b) => a.number - b.number)
    .map(task => `${task.number}. ${task.status === 'done' ? `~~${task.name}~~` : task.name} ${task.description ? `— *${task.description}*` : ''}`)
    .join('\n');
};

export { handleCrossTask };
