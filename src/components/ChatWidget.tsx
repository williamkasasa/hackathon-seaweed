import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { language, t } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessages: Record<string, string> = {
        en: "Hi! I'm Algae 🌊 Your ocean wellness guide! I can help you discover amazing sea vegetable recipes, nutritional info, and product recommendations. What brings you here today?",
        fr: "Salut! Je suis Algae 🌊 Votre guide du bien-être océanique! Je peux vous aider à découvrir des recettes incroyables de légumes de mer, des infos nutritionnelles et des recommandations de produits. Qu'est-ce qui vous amène ici aujourd'hui?",
        nl: "Hoi! Ik ben Algae 🌊 Uw oceaan wellness gids! Ik kan u helpen met geweldige zeegroenten recepten, voedingsinformatie en productaanbevelingen. Wat brengt u hier vandaag?",
      };
      
      setMessages([{
        role: 'assistant',
        content: welcomeMessages[language] || welcomeMessages.en,
      }]);
    }
  }, [isOpen, language]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/algae-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            language,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast({
            title: 'Rate limit exceeded',
            description: 'Please wait a moment before sending another message.',
            variant: 'destructive',
          });
          setMessages(prev => prev.slice(0, -1));
          return;
        }
        if (response.status === 402) {
          toast({
            title: 'Service unavailable',
            description: 'AI service requires payment. Please contact support.',
            variant: 'destructive',
          });
          setMessages(prev => prev.slice(0, -1));
          return;
        }
        throw new Error('Failed to get response');
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const updateAssistantMessage = (content: string) => {
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage?.role === 'assistant') {
            return [...prev.slice(0, -1), { role: 'assistant', content }];
          }
          return [...prev, { role: 'assistant', content }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              updateAssistantMessage(assistantContent);
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Generate voice if enabled and we have content
      if (voiceEnabled && assistantContent) {
        await playVoice(assistantContent);
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const playVoice = async (text: string) => {
    try {
      setIsSpeaking(true);
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, voiceId: 'EXAVITQu4vr4xnSDxMaL' } // Sarah voice
      });

      if (error) throw error;

      if (data?.audioContent) {
        // Stop any currently playing audio
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }

        // Create and play new audio
        const audio = new Audio(`data:audio/mpeg;base64,${data.audioContent}`);
        audioRef.current = audio;
        
        audio.onended = () => {
          setIsSpeaking(false);
          audioRef.current = null;
        };

        audio.onerror = () => {
          setIsSpeaking(false);
          audioRef.current = null;
        };

        await audio.play();
      }
    } catch (error) {
      console.error('Voice playback error:', error);
      setIsSpeaking(false);
    }
  };

  const toggleVoice = () => {
    if (isSpeaking && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsSpeaking(false);
    }
    setVoiceEnabled(!voiceEnabled);
  };

  return (
    <>
      {/* Chat Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-[#088395] to-[#00D9A3] hover:shadow-xl transition-all z-50"
        aria-label="Open chat"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-background border rounded-lg shadow-2xl flex flex-col z-50 animate-scale-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#088395] to-[#00D9A3] text-white p-4 rounded-t-lg">
            <h3 className="font-semibold text-lg">{t('chat.title')}</h3>
            <p className="text-sm opacity-90">{t('chat.subtitle')}</p>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-[#088395] text-white'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted p-3 rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t space-y-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={voiceEnabled ? "default" : "outline"}
                size="sm"
                onClick={toggleVoice}
                disabled={isLoading}
                className="whitespace-nowrap"
              >
                {isSpeaking ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : voiceEnabled ? (
                  <Volume2 className="h-4 w-4 mr-1" />
                ) : (
                  <VolumeX className="h-4 w-4 mr-1" />
                )}
                {voiceEnabled ? 'Voice On' : 'Voice Off'}
              </Button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('chat.placeholder')}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                size="icon"
                className="bg-[#088395] hover:bg-[#076d7e]"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
