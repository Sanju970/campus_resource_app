import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import Layout from './Layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

import {
  Calendar,
  Users,
  MapPin,
  Sparkles,
  ShieldCheck,
  Bot,
  Brain,
} from 'lucide-react';

function AboutContent({ showLoginButton, onLoginClick }) {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Login button only when NOT logged in */}
      {showLoginButton && (
        <div className="w-full flex justify-end mb-4">
          <Button
            className="bg-blue-600 text-white"
            onClick={onLoginClick}
          >
            Login
          </Button>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white p-8 md:p-12">
        <div className="relative z-10 space-y-4">
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            About Campus Resource Portal
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold">
            Smart campus hub with AI-powered assistance.
          </h1>
          <p className="text-base md:text-lg text-white/90 max-w-2xl">
            The Campus Resource Portal brings together events, student organizations, and campus
            services — with an AI assistant that helps you quickly find information, resources,
            and opportunities.
          </p>
        </div>

        {/* Decorative bubbles */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      </div>

      {/* What the portal does */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">What is the Campus Resource Portal?</h2>
        <p className="text-sm text-muted-foreground max-w-3xl">
          The Campus Resource Portal is a central hub for everything happening on campus.
          From student organizations and academic events to support services and workshops,
          the portal brings everything together — and uses AI to help you find what you need, faster.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-base">Connect with Organizations</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Discover clubs, student groups, and campus organizations that match your
              interests, and stay updated on what they&apos;re doing.
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-base">Stay on Top of Events</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Browse upcoming events, workshops, and seminars, and get a clear view of what&apos;s
              happening on campus.
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-base">AI Campus Assistant</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Ask questions in natural language and let the AI assistant help you find events,
              resources, and campus information without searching through multiple pages.
            </CardContent>
          </Card>
        </div>
      </div>

      {/* How it works & AI highlight */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Card>
          <CardHeader>
            <CardTitle>How the portal fits into campus life</CardTitle>
            <CardDescription>
              A simple experience designed for students, faculty, and administrators.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex gap-3">
              <div className="mt-1 h-6 w-6 flex items-center justify-center rounded-full bg-blue-500 text-white text-xs">
                1
              </div>
              <div>
                <p className="font-medium">Explore campus activity</p>
                <p className="text-muted-foreground">
                  See what&apos;s happening across campus, from academic events to
                  student-led activities and organization meetings.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="mt-1 h-6 w-6 flex items-center justify-center rounded-full bg-purple-500 text-white text-xs">
                2
              </div>
              <div>
                <p className="font-medium">Discover organizations</p>
                <p className="text-muted-foreground">
                  Find student organizations that match your interests and learn how to
                  get involved.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="mt-1 h-6 w-6 flex items-center justify-center rounded-full bg-green-500 text-white text-xs">
                3
              </div>
              <div>
                <p className="font-medium">Use AI to find resources</p>
                <p className="text-muted-foreground">
                  Ask the AI assistant about events, study spaces, or campus services, and
                  get guided directly to helpful information.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="mt-1 h-6 w-6 flex items-center justify-center rounded-full bg-orange-500 text-white text-xs">
                4
              </div>
              <div>
                <p className="font-medium">Stay organized</p>
                <p className="text-muted-foreground">
                  Use the schedule view in the portal to keep track of important dates,
                  deadlines, and upcoming events.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI & Engagement Highlight */}
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
          <CardHeader>
            <CardTitle>AI-powered campus experience</CardTitle>
            <CardDescription>
              Smarter search, helpful suggestions, and instant answers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-500 flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium">Natural language questions</p>
                <p className="text-muted-foreground">
                  Type a question the way you would normally ask it, and the AI assistant helps
                  you locate relevant events, services, and resources.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-purple-500 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium">Helpful suggestions</p>
                <p className="text-muted-foreground">
                  Get suggestions for workshops, campus events, and support options that
                  match what you&apos;re looking for.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-green-500 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium">Faster navigation</p>
                <p className="text-muted-foreground">
                  Move quickly to the right page or section in the portal without clicking
                  through multiple menus.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Who it's for / Values */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>For Students</CardTitle>
            <CardDescription>Stay informed, involved, and supported.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• Discover campus events and student organizations.</p>
            <p>• Quickly find academic and support resources.</p>
            <p>• Use AI guidance to answer common campus questions.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>For Faculty</CardTitle>
            <CardDescription>Support engagement beyond the classroom.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• Highlight academic events, talks, and workshops.</p>
            <p>• Share opportunities and resources with students.</p>
            <p>• Help direct students to campus support services.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>For Administrators</CardTitle>
            <CardDescription>Make campus activity more visible.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• Showcase key campus initiatives and events.</p>
            <p>• Improve visibility of student support services.</p>
            <p>• Strengthen connection across the campus community.</p>
          </CardContent>
        </Card>
      </div>

      {/* Values / Promise */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Our focus</CardTitle>
            <CardDescription>
              A modern, AI-enhanced portal designed around real campus needs.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              Reliable Access
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              AI-Powered
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Community-Driven
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          The Campus Resource Portal is built to reduce friction, not add more steps. Instead of
          searching across multiple sites, emails, and flyers, everything is brought together in
          one place — with an AI assistant that helps you get answers and find opportunities in
          just a few clicks.
        </CardContent>
      </Card>

      {/* Final Info Banner */}
      <div className="rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white p-6 md:p-8 space-y-2">
        <h2 className="text-xl md:text-2xl font-semibold">A single place for campus resources</h2>
        <p className="text-sm md:text-base text-white/90 max-w-xl">
          Whether you&apos;re exploring organizations, checking upcoming events, or looking for
          support services, the Campus Resource Portal is designed to keep everything clear,
          organized, and easy to find.
        </p>
      </div>
    </div>
  );
}

export default function AboutPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const content = (
    <AboutContent
      showLoginButton={!user}
      onLoginClick={() => navigate('/login')}
    />
  );

  // If logged in → wrap in Layout to show navbar
  if (user) {
    return <Layout>{content}</Layout>;
  }

  // If not logged in → just show About content with Login button
  return content;
}
