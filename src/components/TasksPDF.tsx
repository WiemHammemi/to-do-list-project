// components/TasksPDF.tsx
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Enregistrer une police qui supporte les accents français
Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Roboto',
    fontSize: 10,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    color: '#3B82F6',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  stats: {
    fontSize: 11,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 20,
    paddingVertical: 10,
  },
  table: {
    display: 'flex',
    width: '100%',
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    padding: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
    padding: 8,
    minHeight: 30,
  },
  tableRowEven: {
    backgroundColor: '#F9FAFB',
  },
  colTitle: {
    width: '40%',
    paddingRight: 5,
  },
  colStatus: {
    width: '20%',
    textAlign: 'center',
  },
  colPriority: {
    width: '20%',
    textAlign: 'center',
  },
  colDate: {
    width: '20%',
    textAlign: 'center',
  },
  priorityHigh: {
    color: '#DC2626',
  },
  priorityMedium: {
    color: '#F59E0B',
  },
  priorityLow: {
    color: '#10B981',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 8,
  },
});

interface Task {
  id: number;
  title: string;
  status: string;
  priority: string;
  due_date: Date | null;
}

interface TasksPDFProps {
  tasks: Task[];
}

const translateStatus = (status: string) => {
  const translations: Record<string, string> = {
    'pending': 'En attente',
    'progress': 'En cours',
    'completed': 'Terminée'
  };
  return translations[status] || status;
};

const translatePriority = (priority: string) => {
  const translations: Record<string, string> = {
    'high': 'Haute',
    'medium': 'Moyenne',
    'low': 'Basse'
  };
  return translations[priority] || priority;
};

const getPriorityStyle = (priority: string) => {
  if (priority === 'high') return styles.priorityHigh;
  if (priority === 'medium') return styles.priorityMedium;
  if (priority === 'low') return styles.priorityLow;
  return {};
};

const TasksPDF: React.FC<TasksPDFProps> = ({ tasks }) => {
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    progress: tasks.filter(t => t.status === 'progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Liste des Tâches</Text>
          
        </View>


        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colTitle}>Titre</Text>
            <Text style={styles.colStatus}>Statut</Text>
            <Text style={styles.colPriority}>Priorité</Text>
            <Text style={styles.colDate}>Date d'échéance</Text>
          </View>

          {tasks.map((task, index) => (
            <View 
              key={task.id} 
              style={[
                styles.tableRow,
                index % 2 === 0 ? styles.tableRowEven : {}
              ]}
            >
              <Text style={styles.colTitle}>{task.title}</Text>
              <Text style={styles.colStatus}>{translateStatus(task.status)}</Text>
              <Text style={[styles.colPriority, getPriorityStyle(task.priority)]}>
                {translatePriority(task.priority)}
              </Text>
              <Text style={styles.colDate}>
                {task.due_date 
                  ? new Date(task.due_date).toLocaleDateString('fr-FR')
                  : '-'
                }
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Document généré automatiquement - {tasks.length} tâche{tasks.length > 1 ? 's' : ''} au total
        </Text>
      </Page>
    </Document>
  );
};

export default TasksPDF;