import { ChannelType } from 'discord.js';

const handleDeleteTodo = async (interaction, todosCollection) => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  if (commandName === 'deletetodo') {
    const todoChannelId = options.getChannel('todo_channel').id;

    try {
      // Fetch the todo channel
      const todoChannel = await interaction.guild.channels.fetch(todoChannelId);
      if (!todoChannel || todoChannel.type !== ChannelType.GuildText) {
        return interaction.reply({ content: 'Erreur : Canal de liste de tâches non valide.', ephemeral: true });
      }

      // Delete the todo document from the database
      const result = await todosCollection.deleteOne({ channelId: todoChannelId });

      // Check if the document was deleted
      if (result.deletedCount === 0) {
        return interaction.reply({ content: 'Erreur : Liste de tâches non trouvée.', ephemeral: true });
      }

      // Optionally, delete all pinned messages in the channel
      const messages = await todoChannel.messages.fetch();
      const pinnedMessages = messages.filter(msg => msg.pinned);
      for (const message of pinnedMessages.values()) {
        await message.delete();
      }

      // Delete the channel
      await todoChannel.delete();

      await interaction.reply({ content: 'Liste de tâches et canal supprimés avec succès.', ephemeral: true });
    } catch (error) {
      console.error('Erreur lors de la suppression de la liste de tâches :', error);
      await interaction.reply({ content: 'Erreur : Impossible de supprimer la liste de tâches.', ephemeral: true });
    }
  }
};

export { handleDeleteTodo };
