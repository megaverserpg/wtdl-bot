import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const clientId = process.env.CLIENT_ID;
const token = process.env.DISCORD_TOKEN;

const registerCommands = async () => {
  const commands = [
    {
      name: 'createtodo',
      description: 'Crée une nouvelle liste de tâches.',
      options: [
        {
          type: 3, // STRING
          name: 'name',
          description: 'Nom de la liste de tâches',
          required: true,
        },
        {
          type: 7, // CHANNEL
          name: 'category',
          description: 'Catégorie dans laquelle créer la liste',
          required: true,
        }
      ],
    },
    {
      name: 'showtodos',
      description: 'Afficher toutes les to-dos.',
    },
    {
      name: 'addtask',
      description: 'Ajoute une tâche à une liste de tâches.',
      options: [
        {
          type: 7, // CHANNEL
          name: 'todo_channel',
          description: 'Canal de la liste de tâches',
          required: true,
        },
        {
          type: 3, // STRING
          name: 'task_name',
          description: 'Nom de la tâche',
          required: true,
        },
        {
          type: 3, // STRING
          name: 'task_description',
          description: 'Description de la tâche',
          required: false,
        },
        {
          type: 4, // INTEGER
          name: 'task_number',
          description: 'Numéro de la tâche (laisser vide pour ajouter à la fin)',
          required: false,
        },
      ],
    },
    {
      name: 'crosstask',
      description: 'Marque une tâche comme terminée.',
      options: [
        {
          type: 7, // CHANNEL
          name: 'todo_channel',
          description: 'Le canal de la liste de tâches',
          required: true,
        },
        {
          type: 4, // INTEGER
          name: 'task_number',
          description: 'Le numéro de la tâche à marquer comme terminée',
          required: true,
        },
      ],
    },
    {
      name: 'uncrosstask',
      description: 'Marque une tâche comme en cours.',
      options: [
        {
          type: 7, // CHANNEL
          name: 'todo_channel',
          description: 'Le canal de la liste de tâches',
          required: true,
        },
        {
          type: 4, // INTEGER
          name: 'task_number',
          description: 'Le numéro de la tâche à dé-marquer',
          required: true,
        },
      ],
    },
    {
      name: 'edittask',
      description: 'Modifie une tâche existante dans une liste de tâches.',
      options: [
        {
          type: 7, // CHANNEL
          name: 'todo_channel',
          description: 'Le canal de la liste de tâches',
          required: true,
        },
        {
          type: 4, // INTEGER
          name: 'task_number',
          description: 'Le numéro de la tâche à modifier',
          required: true,
        },
        {
          type: 3, // STRING
          name: 'new_task_name',
          description: 'Le nouveau nom de la tâche',
          required: false,
        },
        {
          type: 3, // STRING
          name: 'new_task_description',
          description: 'La nouvelle description de la tâche',
          required: false,
        },
        {
          type: 4, // INTEGER
          name: 'new_task_number',
          description: 'Le nouveau numéro de la tâche',
          required: false,
        },
      ],
    },
    {
      name: 'deletetask',
      description: 'Supprime une tâche d\'une liste de tâches existante.',
      options: [
        {
          type: 7, // CHANNEL
          name: 'todo_channel',
          description: 'Le canal de la liste de tâches',
          required: true,
        },
        {
          type: 4, // INTEGER
          name: 'task_number',
          description: 'Le numéro de la tâche à supprimer',
          required: true,
        },
      ],
    },
    {
      name: 'deletetodo',
      description: 'Supprimer une To-Do List.',
      options: [
        {
          type: 7, // CHANNEL
          name: 'todo_channel',
          description: 'Canal de la To-Do List',
          required: true
        }
      ]
    },
    {
      name: 'help',
      description: 'Affiche la liste des commandes disponibles.',
    },
  ];

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log('Commands registered successfully.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
};

export { registerCommands };
