import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ChannelType } from 'discord.js';

const handleCreateTodo = async (interaction, todosCollection) => {
  // Réponse immédiate pour indiquer que la commande est en cours
  await interaction.reply({ content: 'Création en cours...', ephemeral: true });

  const name = interaction.options.getString('name');
  const category = interaction.options.getChannel('category');

  if (!category || category.type !== ChannelType.GuildCategory) {
    // Réponse rapide si la catégorie est invalide
    await interaction.editReply({ content: 'Erreur : Catégorie non trouvée ou invalide.' });
    return;
  }

  try {
    // Créer le canal de texte sous la catégorie spécifiée
    const newChannel = await interaction.guild.channels.create({
      name: `todo-${name}`,
      type: ChannelType.GuildText,
      parent: category.id,
    });

    // Créer un embed pour la to-do list
    const embed = new EmbedBuilder()
      .setTitle(name)
      .setDescription('Liste des tâches:')
      .setColor('#0099ff');

    // Ajouter les boutons à la to-do list
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('add_task')
          .setLabel('☐ Ajouter')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('cross_task')
          .setLabel('✓ Cocher')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('uncross_task')
          .setLabel('☐ Décocher')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('edit_task')
          .setLabel('✎ Éditer')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('delete_task')
          .setLabel('✕ Supprimer')
          .setStyle(ButtonStyle.Danger)
      );

    // Envoyer l'embed dans le nouveau canal
    const message = await newChannel.send({ embeds: [embed], components: [row] });

    // Insérer la to-do list dans la base de données
    await todosCollection.insertOne({
      name: name,
      channelId: newChannel.id,
      messageId: message.id,
      tasks: [],
    });

    // Répondre que tout s'est bien passé
    await interaction.editReply({ content: `La To-Do List "${name}" a été créée avec succès dans le canal ${newChannel}.` });
  } catch (error) {
    console.error('Erreur lors de la création du canal ou de l\'insertion dans la base de données:', error);
    // Réponse d'erreur rapide en cas de problème
    await interaction.editReply({ content: 'Erreur : Impossible de créer le canal ou d\'enregistrer dans la base de données.' });
  }
};

export { handleCreateTodo };
