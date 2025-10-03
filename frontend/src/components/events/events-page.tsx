"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventTimeline } from "./event-timeline";
import { EventAnalytics } from "./event-analytics";
import { Activity, BarChart3 } from "lucide-react";

export function EventsPage() {
  const [activeTab, setActiveTab] = useState("timeline");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Network Events</h1>
        <p className="text-muted-foreground">
          Monitor real-time events and analytics from Doma Protocol
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Event Timeline
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-6">
          <EventTimeline autoRefresh refreshInterval={10000} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <EventAnalytics autoRefresh refreshInterval={10000} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
