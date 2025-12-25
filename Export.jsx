
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Application } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


const SECTION_ORDER = [
  "personal",
  "nationality",
  "travel",
  "travelCompanions",
  "usHistory",
  "addressPhone",
  "passport",
  "family",
  "spouse",
  "workEducation",
  "security",
  "additionalInfo"
];

export default function ExportPage() {
  const location = useLocation();
  const [application, setApplication] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const appId = new URLSearchParams(location.search).get('appId');

  useEffect(() => {
    if (appId && appId !== 'null' && appId !== 'undefined') {
      Application.get(appId)
        .then(setApplication)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else {
        setIsLoading(false);
    }
  }, [appId]);

  const downloadJSON = () => {
    if (!application) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(application.data, null, 2))}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `DS-160_Application_${appId}.json`;
    link.click();
  };
  const formatDs160Text = () => {
    const data = application?.data || {};
    const sections = data.sections || data;
    const lines = [];
    const qaStatus = data.review?.qa_status || data.qa_status || '';
    if (qaStatus) lines.push(`QA Status: ${qaStatus}`);
    const flags = data.review?.qa_flags || data.qa_flags || [];
    if (flags?.length) {
      lines.push(`QA Flags: ${flags.length}`);
      flags.forEach((f, idx) => {
        lines.push(`- [${f.level || 'info'}] ${f.section || ''}${f.field ? ' • ' + f.field : ''}: ${f.message}`);
      });
    }
    for (const sec of SECTION_ORDER) {
      const obj = sections?.[sec];
      if (!obj) continue;
      lines.push(`\n=== ${sec} ===`);
      Object.entries(obj).forEach(([k, v]) => {
        if (v === null || v === undefined || v === '') return;
        if (typeof v === 'object') {
          lines.push(`${k}: ${JSON.stringify(v)}`);
        } else {
          lines.push(`${k}: ${String(v)}`);
        }
      });
    }
    return lines.join("\n");
  };

  const downloadText = () => {
    const content = formatDs160Text();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ds160-ready-${appId || 'application'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  if (isLoading) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <Skeleton className="h-10 w-1/3 mb-4" />
        <Skeleton className="h-6 w-full mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!application) {
    return <div className="p-8 text-center">Application not found.</div>;
  }
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Application Submitted!</h1>
      <p className="text-slate-600 mb-6">Your application data has been successfully submitted. You can download a copy of your data for your records.</p>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Application Data Export</CardTitle>
          <CardDescription>Applicant: {(application.data?.personal?.givenNames || '') + ' ' + (application.data?.personal?.surnames || '') || 'N/A'}</CardDescription>
        </CardHeader>
        <CardContent>
          {(application.data?.review?.qa_status || application.data?.qa_status) ? (
            <div className="mb-3 text-sm text-slate-700">
              <span className="font-semibold">QA Status:</span> {application.data?.review?.qa_status || application.data?.qa_status}
            </div>
          ) : null}
          <Button onClick={downloadJSON}>
            <Download className="w-4 h-4 mr-2" />
            Download Application Data (JSON)
          </Button>
          <Button onClick={downloadText} variant="secondary" className="ml-2">
            <Download className="w-4 h-4 mr-2" />
            Download DS-160 Ready (TXT)
          </Button>
          <div className="mt-4 p-4 bg-slate-100 rounded-lg max-h-96 overflow-auto">
            <pre className="text-sm">{JSON.stringify(application.data, null, 2)}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
