import { EmbedBuilder } from 'discord.js';

const handleShowTodos = async (interaction, todosCollection) => {
  if (!interaction.isCommand()) return;

  try {
    // Defer the reply to handle long operations
    await interaction.deferReply();

    // Fetch all todo documents
    const todos = await todosCollection.find().toArray();

    if (todos.length === 0) {
      return await interaction.editReply({ content: 'Aucune to-do trouvée.', ephemeral: true });
    }

    // Iterate through todos and create a separate embed for each
    for (const todo of todos) {
      // Create an embed for each to-do
      const embed = new EmbedBuilder()
        .setTitle(todo.name || 'To-Do List')
        .setColor(0x00AE86);

      // Build the description for each task
      const description = todo.tasks
        .sort((a, b) => a.number - b.number) // Ensure tasks are sorted by number
        .map(task => {
          // Format the task name and description
          const taskName = task.status === 'done' ? `~~${task.name}~~` : task.name;
          return `${task.number}. ${taskName} ${task.description ? `— *${task.description}*` : ''}\n`;
        })
        .join('\n');

      // Set the embed description
      embed.setDescription(description || 'Aucune tâche');

      // Send the embed message
      await interaction.followUp({ embeds: [embed] });
    }

    // Edit the deferred reply to notify that the operation is complete
    await interaction.editReply({ content: 'Affichage des to-dos terminé.', ephemeral: true });

  } catch (error) {
    console.error('Erreur lors de l\'affichage des to-dos :', error);
    await interaction.editReply({ content: 'Erreur lors de l\'affichage des to-dos.', ephemeral: true });
  }
};

export { handleShowTodos };
