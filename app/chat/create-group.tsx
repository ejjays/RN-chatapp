import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  SafeAreaView,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getUsers, createOrGetChat } from '@/lib/firestore';
import { User } from '@/types';
import { ContactItem } from '@/components/ContactItem';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ArrowLeft, Check } from 'lucide-react-native';

export default function CreateGroupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [contacts, setContacts] = useState<User[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const users = await getUsers();
      // Filter out current user
      const filteredUsers = users.filter(u => u.uid !== user?.uid);
      setContacts(filteredUsers);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      Alert.alert('Error', 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleContactSelect = (contact: User) => {
    setSelectedContacts(prev => {
      const isSelected = prev.some(c => c.uid === contact.uid);
      if (isSelected) {
        return prev.filter(c => c.uid !== contact.uid);
      } else {
        return [...prev, contact];
      }
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (selectedContacts.length === 0) {
      Alert.alert('Error', 'Please select at least one contact');
      return;
    }

    if (!user) return;

    setCreating(true);
    try {
      const participantIds = [user.uid, ...selectedContacts.map(c => c.uid)];
      const chatId = await createOrGetChat(participantIds, true, groupName.trim());
      
      router.replace(`/chat/${chatId}`);
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const renderContactItem = ({ item }: { item: User }) => {
    const isSelected = selectedContacts.some(c => c.uid === item.uid);
    
    return (
      <TouchableOpacity 
        style={[styles.contactItem, isSelected && styles.selectedContactItem]}
        onPress={() => handleContactSelect(item)}
      >
        <ContactItem user={item} onPress={() => {}} />
        {isSelected && (
          <View style={styles.checkIcon}>
            <Check size={20} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#007AFF" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>New Group</Text>
        
        <TouchableOpacity 
          style={[styles.createButton, creating && styles.createButtonDisabled]}
          onPress={handleCreateGroup}
          disabled={creating}
        >
          <Text style={[styles.createButtonText, creating && styles.createButtonTextDisabled]}>
            {creating ? 'Creating...' : 'Create'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.groupNameContainer}>
        <TextInput
          style={styles.groupNameInput}
          placeholder="Group name"
          value={groupName}
          onChangeText={setGroupName}
          maxLength={50}
        />
      </View>

      <View style={styles.selectedContainer}>
        <Text style={styles.sectionTitle}>
          Selected: {selectedContacts.length}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Contacts</Text>
      
      {contacts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No contacts available</Text>
        </View>
      ) : (
        <FlatList
          data={contacts}
          renderItem={renderContactItem}
          keyExtractor={(item) => item.uid}
          style={styles.contactsList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#007AFF',
  },
  createButtonTextDisabled: {
    color: '#8E8E93',
  },
  groupNameContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  groupNameInput: {
    fontSize: 17,
    fontFamily: 'Inter-Regular',
    color: '#000000',
    paddingVertical: 12,
  },
  selectedContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#8E8E93',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  contactsList: {
    flex: 1,
  },
  contactItem: {
    position: 'relative',
  },
  selectedContactItem: {
    backgroundColor: '#E3F2FD',
  },
  checkIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#8E8E93',
  },
});