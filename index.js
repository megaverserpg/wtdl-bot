import { Client, GatewayIntentBits, Events } from 'discord.js';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import { registerCommands } from './src/commands/commands.js';
import { handleCreateTodo } from './src/commands/createtodo.js';
import { handleAddTask } from './src/commands/addtask.js';
import { handleCrossTask } from './src/commands/crosstask.js';
import { handleUncrossTask } from './src/commands/uncrosstask.js';
import { handleEditTask } from './src/commands/edittask.js';
import { handleDeleteTask } from './src/commands/deletetask.js';
import { handleShowTodos } from './src/commands/showtodos.js';
import { handleDeleteTodo } from './src/commands/deletetodo.js';
import { handleHelp } from './src/commands/help.js';
import { handleButtonInteraction } from './src/commands/buttonInteraction.js';
import { handleAddTaskModalSubmission } from './src/modals/addTaskModal.js';
import { handleEditTaskModalSubmission, handleTaskSelectMenu } from './src/modals/editTaskModal.js';
import { handleCrossTaskModalSubmission } from './src/modals/crossTaskModal.js';
import { handleUncrossTaskModalSubmission } from './src/modals/uncrossTaskModal.js';
import { handleDeleteTaskModalSubmission } from './src/modals/deleteTaskModal.js';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const mongoUri = process.env.MONGO_URI;
const dbName = 'todo_bot';
const collectionName = 'todos';

let db, todosCollection;

client.once(Events.ClientReady, async () => {
  const clientMongo = new MongoClient(mongoUri, { useUnifiedTopology: true });
  try {
    await clientMongo.connect();
    console.log('Connected to MongoDB');
    db = clientMongo.db(dbName);
    todosCollection = db.collection(collectionName);

    await registerCommands(client);

    client.on(Events.InteractionCreate, async (interaction) => {
      try {
        if (interaction.isCommand()) {
          await handleCommand(interaction);
        } else if (interaction.isModalSubmit()) {
          await handleModal(interaction);
        } else if (interaction.isButton()) {
          await handleButtonInteraction(interaction, todosCollection);
        } else if (interaction.isStringSelectMenu()) {
          await handleTaskSelectMenu(interaction, todosCollection); // Gestion des sélecteurs
        }
      } catch (error) {
        console.error('Erreur lors du traitement de l\'interaction :', error);
        if (!interaction.replied) {
          await interaction.reply({ content: 'Erreur interne du bot.', ephemeral: true });
        }
      }
    });
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
});

const handleCommand = async (interaction) => {
  switch (interaction.commandName) {
    case 'createtodo':
      await handleCreateTodo(interaction, todosCollection);
      break;
    case 'addtask':
      await handleAddTask(interaction, todosCollection);
      break;
    case 'deletetask':
      await handleDeleteTask(interaction, todosCollection);
      break;
    case 'crosstask':
      await handleCrossTask(interaction, todosCollection);
      break;
    case 'uncrosstask':
      await handleUncrossTask(interaction, todosCollection);
      break;
    case 'edittask':
      await handleEditTask(interaction, todosCollection);
      break;
    case 'deletetodo':
      await handleDeleteTodo(interaction, todosCollection);
      break;
    case 'showtodos':
      await handleShowTodos(interaction, todosCollection);
      break;
    case 'help':
      await handleHelp(interaction);
      break;
    default:
      console.log(`Unknown command: ${interaction.commandName}`);
  }
};

const handleModal = async (interaction) => {
  switch (interaction.customId) {
    case 'add_task_modal':
      await handleAddTaskModalSubmission(interaction, todosCollection);
      break;
    case 'edit_task_modal':
      await handleEditTaskModalSubmission(interaction, todosCollection);
      break;
    case 'cross_task_modal':
      await handleCrossTaskModalSubmission(interaction, todosCollection);
      break;
    case 'uncross_task_modal':
      await handleUncrossTaskModalSubmission(interaction, todosCollection);
      break;
    case 'delete_task_modal':
      await handleDeleteTaskModalSubmission(interaction, todosCollection);
      break;
    default:
      if (!interaction.replied) {
        await interaction.reply({ content: 'Modale non reconnue.', ephemeral: true });
      }
  }
};

client.login(process.env.DISCORD_TOKEN);
