import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Bot, Send, Sparkles } from 'lucide-react';
import { campusResources } from '../types/resources';
//import { sampleEvents } from '../types/events';
import { sampleAnnouncements } from '../types/announcements';
import { sampleMaterials } from '../types/materials';

// AI response generator function
const generateAIResponse = (userMessage) => {
  if (!userMessage || typeof userMessage !== 'string') return `I'm not sure how to help with that.`;
  
  const lowerMessage = userMessage.toLowerCase().trim();
  const keywords = lowerMessage.split(/\s+/).filter(word => word.length > 2);

  // Search for events
  const matchingEvents = sampleEvents.filter(event =>
    keywords.some(keyword =>
      (event.title || '').toLowerCase().includes(keyword) ||
      (event.description || '').toLowerCase().includes(keyword) ||
      (event.location || '').toLowerCase().includes(keyword) ||
      (event.category_id || '').toLowerCase().includes(keyword)
    ) && event.is_active
  );

  // Search for announcements
  const matchingAnnouncements = sampleAnnouncements.filter(announcement =>
    keywords.some(keyword =>
      (announcement.title || '').toLowerCase().includes(keyword) ||
      (announcement.content || '').toLowerCase().includes(keyword)
    ) && announcement.is_active
  );

  // Search for materials
  const matchingMaterials = sampleMaterials.filter(material =>
    keywords.some(keyword =>
      (material.title || '').toLowerCase().includes(keyword) ||
      (material.description || '').toLowerCase().includes(keyword) ||
      (material.category_id || '').toLowerCase().includes(keyword)
    ) && material.is_active
  );

  // Search for resources
  const matchingResources = campusResources.filter(resource =>
    keywords.some(keyword =>
      (resource.title || '').toLowerCase().includes(keyword) ||
      (resource.description || '').toLowerCase().includes(keyword) ||
      (resource.tags || []).some(tag => tag.toLowerCase().includes(keyword))
    )
  );

  // Event queries
  if (lowerMessage.includes('event') || lowerMessage.includes('rsvp') || lowerMessage.includes('register')) {
    if (matchingEvents.length > 0) {
      const event = matchingEvents[0];
      return `I found "${event.title}"!\n\n${event.description}\n\n📅 Date: ${event.date_time ? new Date(event.date_time).toLocaleDateString() : 'TBD'}\n📍 Location: ${event.location || 'TBD'}\n👥 Capacity: ${event.capacity || 'N/A'}\n\nWould you like to RSVP? Check the Events page for more details!`;
    }
    return `Check out our Events page for upcoming campus events! Academic workshops, career fairs, wellness programs, and more.`;
  }

  // Announcement queries
  if (lowerMessage.includes('announcement') || lowerMessage.includes('news') || lowerMessage.includes('update')) {
    if (matchingAnnouncements.length > 0) {
      const announcement = matchingAnnouncements[0];
      return `📢 ${announcement.title}\n\n${announcement.content}\n\nPosted by ${announcement.created_by_name || 'Unknown'}\nPriority: ${(announcement.priority || '').toUpperCase()}`;
    }
    return `Visit the Announcements page to see all campus updates. Filter by priority (urgent, high, medium, low).`;
  }

  // Materials queries
  if (lowerMessage.includes('material') || lowerMessage.includes('study') || lowerMessage.includes('download') ||
      lowerMessage.includes('notes') || lowerMessage.includes('video') || lowerMessage.includes('tutorial')) {
    if (matchingMaterials.length > 0) {
      const material = matchingMaterials[0];
      return `📚 ${material.title}\n\n${material.description}\nType: ${material.resource_type || 'N/A'}\nUploaded by: ${material.created_by_name || 'Unknown'}\nDownloads: ${material.download_count || 0}\n\nYou can find this and more on the Materials page!`;
    }
    return `The Materials page has lecture notes, video tutorials, presentations, and datasets. Search by category and resource type.`;
  }

  // Library queries
  if (lowerMessage.includes('library') || lowerMessage.includes('book')) {
    const library = campusResources.find(r => String(r.id) === '1') || {};
    return `📖 The Central Library is your go-to study spot!\n\n${library.description || 'A large collection of books and digital resources.'}\n📍 Location: ${library.location || 'Main Campus'}\n🕐 Hours: ${library.hours || 'Varies'}\n📞 Contact: ${library.contact || 'N/A'}`;
  }

  // Tutoring / academic support
  if (lowerMessage.includes('tutor') || lowerMessage.includes('help with') || lowerMessage.includes('academic')) {
    return `🎓 Academic support services:\n• Writing Center (Student Success Center, Room 201)\n• Math Tutoring Lab (Science Building, Room 105)\n• International Student Services`;
  }

  // Career queries
  if (lowerMessage.includes('career') || lowerMessage.includes('job') || lowerMessage.includes('internship') || lowerMessage.includes('resume')) {
    return `💼 Career Development Center services:\n• Resume & cover letter reviews\n• Mock interviews\n• Job search strategies\n• Internship opportunities\n• Career counseling`;
  }

  // Mental health / wellness
  if (lowerMessage.includes('mental health') || lowerMessage.includes('stress') || lowerMessage.includes('counsel') ||
      lowerMessage.includes('wellness') || lowerMessage.includes('anxiety')) {
    return `💚 Wellbeing services:\n• Counseling Services (Wellness Center)\n• Student Health Center\n• Recreation Center\n🆘 Crisis support available 24/7`;
  }

  // Tech/IT
  if (lowerMessage.includes('wifi') || lowerMessage.includes('computer') || lowerMessage.includes('tech') ||
      lowerMessage.includes('laptop') || lowerMessage.includes('password')) {
    return `💻 IT Help Desk assists with WiFi, software, device repair, loaner laptops, and password resets.`;
  }

  // Gym/fitness
  if (lowerMessage.includes('gym') || lowerMessage.includes('fitness') || lowerMessage.includes('workout') ||
      lowerMessage.includes('exercise') || lowerMessage.includes('pool')) {
    return `🏋️ Student Recreation Center:\n• Cardio & weight equipment\n• Group classes\n• Indoor track & pool\n• Basketball courts`;
  }

  // Schedule queries
  if (lowerMessage.includes('schedule') || lowerMessage.includes('class') || lowerMessage.includes('timetable')) {
    return `📅 View your personalized schedule on the Schedule page with classes, meetings, events, and office hours.`;
  }

  // Default AI response
  return `👋 I'm your AI campus assistant! I can help you with:\n📅 Events\n📢 Announcements\n📚 Materials\n🏛️ Resources\n⏰ Schedule\n\nAsk me anything like "When is the career fair?" or "Show CS study materials."`;
};

export default function AIChat() {
  const [messages, setMessages] = useState([
    { id: '1', role: 'assistant', content: "Hi! I'm your AI campus assistant. I can help you find events, announcements, study materials, campus resources, and answer questions about services. What can I help you with today?", timestamp: new Date() }
  ]);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');

  const scrollRef = useRef(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);

    const userText = input;
    setInput('');

    setTimeout(() => {
      const aiMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: generateAIResponse(userText), timestamp: new Date() };
      setMessages(prev => [...prev, aiMessage]);
    }, 300);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button size="lg" className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl z-50">
          <Sparkles className="h-6 w-6" />
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
              <Bot className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <div>Campus AI Assistant</div>
              <div className="text-xs text-muted-foreground">Ask about events, resources, and more</div>
            </div>
          </SheetTitle>
        </SheetHeader>

        {/* Scrollable chat */}
        <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto">
          <div className="flex flex-col space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-3 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <p className="whitespace-pre-line">{msg.content}</p>
                  <div className="text-xs opacity-70 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t">
          <form className="flex gap-2" onSubmit={e => { e.preventDefault(); handleSend(); }}>
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about events, materials, resources..."
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <div className="text-xs text-muted-foreground mt-2 text-center">
            AI uses keyword search for demonstration purposes
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
