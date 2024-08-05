import { EmbedBuilder } from 'discord.js';

const handleHelp = async (interaction) => {
  const embed = new EmbedBuilder()
    .setTitle('Liste des Commandes')
    .setColor('#0099ff')
    .setDescription(
      `Voici la liste des commandes disponibles :
      \n**/createtodo** - Crée une nouvelle liste de tâches.
      \n**/showtodos** - Affiche toutes les to-dos.
      \n**/addtask** - Ajoute une tâche à une liste de tâches.
      \n**/crosstask** - Marque une tâche comme terminée.
      \n**/uncrosstask** - Marque une tâche comme en cours.
      \n**/edittask** - Modifie une tâche existante dans une liste de tâches.
      \n**/deletetask** - Supprime une tâche d'une liste de tâches existante.
      \n**/deletetodo** - Supprime une To-Do List.`
    );

  await interaction.reply({ embeds: [embed], ephemeral: true });
};

export { handleHelp };
