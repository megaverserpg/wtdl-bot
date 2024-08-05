import {
  showAddTaskModal,
  handleAddTaskModalSubmission,
} from "../modals/addTaskModal.js";
import {
  handleEditTaskModalSubmission,
  showTaskSelectMenu,
  handleTaskSelectMenu,
} from "../modals/editTaskModal.js";
import {
  showCrossTaskModal,
  handleCrossTaskModalSubmission,
} from "../modals/crossTaskModal.js";
import {
  showUncrossTaskModal,
  handleUncrossTaskModalSubmission,
} from "../modals/uncrossTaskModal.js";
import {
  showDeleteTaskModal,
  handleDeleteTaskModalSubmission,
} from "../modals/deleteTaskModal.js";

const handleButtonInteraction = async (interaction, todosCollection) => {
  if (interaction.isButton()) {
    const customId = interaction.customId;

    try {
      switch (customId) {
        case "add_task":
          await showAddTaskModal(interaction);
          break;
        case "edit_task":
          // Afficher le menu déroulant pour sélectionner une tâche à éditer
          await showTaskSelectMenu(interaction, todosCollection);
          break;
        case "cross_task":
          await showCrossTaskModal(interaction);
          break;
        case "uncross_task":
          await showUncrossTaskModal(interaction);
          break;
        case "delete_task":
          await showDeleteTaskModal(interaction);
          break;
        case "add_task_modal":
          await handleAddTaskModalSubmission(interaction, todosCollection);
          break;
        case "edit_task_modal":
          await handleEditTaskModalSubmission(interaction, todosCollection);
          break;
        case "cross_task_modal":
          await handleCrossTaskModalSubmission(interaction, todosCollection);
          break;
        case "uncross_task_modal":
          await handleUncrossTaskModalSubmission(interaction, todosCollection);
          break;
        case "delete_task_modal":
          await handleDeleteTaskModalSubmission(interaction, todosCollection);
          break;
        default:
          await interaction.reply({
            content: "Commande inconnue.",
            ephemeral: true,
          });
      }
    } catch (error) {
      console.error(
        "Erreur lors de la gestion de l'interaction des boutons :",
        error,
      );
      await interaction.reply({
        content: "Erreur : Impossible de traiter l'interaction.",
        ephemeral: true,
      });
    }
  } else if (interaction.isStringSelectMenu()) {
    const customId = interaction.customId;

    try {
      if (customId === 'task_select_menu') {
        await handleTaskSelectMenu(interaction, todosCollection);
      } else {
        await interaction.reply({
          content: "Sélecteur inconnu.",
          ephemeral: true,
        });
      }
    } catch (error) {
      console.error(
        "Erreur lors de la gestion de l'interaction du menu déroulant :",
        error,
      );
      await interaction.reply({
        content: "Erreur : Impossible de traiter l'interaction du sélecteur.",
        ephemeral: true,
      });
    }
  }
};

export { handleButtonInteraction };
