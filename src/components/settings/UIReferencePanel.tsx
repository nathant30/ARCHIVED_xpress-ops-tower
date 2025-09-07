'use client';

import React, { useState } from 'react';
import { 
  Palette, 
  Type, 
  Square, 
  Circle, 
  Zap, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info,
  Code,
  Copy,
  Users,
  Shield,
  Database,
  Activity
} from 'lucide-react';
import { Button } from '@/components/xpress/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/xpress/card';
import { Badge, StatusBadge } from '@/components/xpress/badge';
import { Button as UIButton } from '@/components/ui/button';
import { Card as UICard, CardHeader as UICardHeader, CardTitle as UICardTitle, CardContent as UICardContent } from '@/components/ui/card';
import { Badge as UIBadge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

const UIReferencePanel = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  const CodeBlock = ({ code, id }: { code: string; id: string }) => (
    <div className="relative bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
      <button
        onClick={() => copyToClipboard(code, id)}
        className="absolute top-2 right-2 p-1 rounded text-gray-400 hover:text-white"
      >
        {copiedCode === id ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
      <pre className="whitespace-pre-wrap">{code}</pre>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <Palette className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold">UI Component Reference</h1>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This reference shows both XPRESS design system components and shadcn/ui components. 
          <strong> Use XPRESS components for business-specific UI elements</strong> to maintain consistency.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="buttons" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="buttons">Buttons</TabsTrigger>
          <TabsTrigger value="cards">Cards</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
        </TabsList>

        {/* Buttons Tab */}
        <TabsContent value="buttons" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                XPRESS Buttons (Recommended)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Primary Buttons */}
              <div>
                <h4 className="font-semibold mb-3">Primary Variants</h4>
                <div className="flex flex-wrap gap-3 mb-4">
                  <Button variant="primary" size="sm">Primary Small</Button>
                  <Button variant="primary" size="md">Primary Medium</Button>
                  <Button variant="primary" size="lg">Primary Large</Button>
                </div>
                <CodeBlock
                  id="primary-buttons"
                  code={`<Button variant="primary" size="md">Primary Button</Button>`}
                />
              </div>

              {/* All Variants */}
              <div>
                <h4 className="font-semibold mb-3">All Button Variants</h4>
                <div className="flex flex-wrap gap-3 mb-4">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="tertiary">Tertiary</Button>
                  <Button variant="success">Success</Button>
                  <Button variant="warning">Warning</Button>
                  <Button variant="danger">Danger</Button>
                  <Button variant="info">Info</Button>
                </div>
                <CodeBlock
                  id="all-variants"
                  code={`<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="tertiary">Tertiary</Button>
<Button variant="success">Success</Button>
<Button variant="warning">Warning</Button>
<Button variant="danger">Danger</Button>
<Button variant="info">Info</Button>`}
                />
              </div>

              {/* Button States */}
              <div>
                <h4 className="font-semibold mb-3">Button States</h4>
                <div className="flex flex-wrap gap-3 mb-4">
                  <Button variant="primary">Normal</Button>
                  <Button variant="primary" loading>Loading</Button>
                  <Button variant="primary" disabled>Disabled</Button>
                  <Button variant="primary" leftIcon={<CheckCircle className="w-4 h-4" />}>With Icon</Button>
                </div>
                <CodeBlock
                  id="button-states"
                  code={`<Button variant="primary">Normal</Button>
<Button variant="primary" loading>Loading</Button>
<Button variant="primary" disabled>Disabled</Button>
<Button variant="primary" leftIcon={<CheckCircle className="w-4 h-4" />}>
  With Icon
</Button>`}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>shadcn/ui Buttons (Fallback)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3 mb-4">
                <UIButton>Default</UIButton>
                <UIButton variant="secondary">Secondary</UIButton>
                <UIButton variant="destructive">Destructive</UIButton>
                <UIButton variant="outline">Outline</UIButton>
                <UIButton variant="ghost">Ghost</UIButton>
              </div>
              <CodeBlock
                id="ui-buttons"
                code={`<Button>Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Destructive</Button>`}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cards Tab */}
        <TabsContent value="cards" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Square className="w-5 h-5" />
                XPRESS Cards (Recommended)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card variant="default">
                  <CardHeader>
                    <CardTitle>Default Card</CardTitle>
                  </CardHeader>
                  <CardContent>
                    This is a default card with shadow
                  </CardContent>
                </Card>

                <Card variant="elevated">
                  <CardHeader>
                    <CardTitle>Elevated Card</CardTitle>
                  </CardHeader>
                  <CardContent>
                    This card has elevated shadow
                  </CardContent>
                </Card>

                <Card variant="outlined">
                  <CardHeader>
                    <CardTitle>Outlined Card</CardTitle>
                  </CardHeader>
                  <CardContent>
                    This card has a prominent border
                  </CardContent>
                </Card>

                <Card variant="ghost">
                  <CardHeader>
                    <CardTitle>Ghost Card</CardTitle>
                  </CardHeader>
                  <CardContent>
                    This card has no background
                  </CardContent>
                </Card>
              </div>
              <CodeBlock
                id="xpress-cards"
                code={`<Card variant="default">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
</Card>`}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interactive Cards</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card hover interactive className="cursor-pointer">
                  <CardContent>
                    <div className="text-center">
                      <Activity className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <h3 className="font-semibold">Hoverable Card</h3>
                      <p className="text-sm text-gray-600">This card responds to hover</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <CodeBlock
                id="interactive-cards"
                code={`<Card hover interactive className="cursor-pointer">
  <CardContent>
    Interactive card content
  </CardContent>
</Card>`}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Circle className="w-5 h-5" />
                XPRESS Badges (Recommended)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Standard Badges</h4>
                <div className="flex flex-wrap gap-3 mb-4">
                  <Badge variant="default">Default</Badge>
                  <Badge variant="primary">Primary</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="danger">Danger</Badge>
                  <Badge variant="info">Info</Badge>
                </div>
                <CodeBlock
                  id="standard-badges"
                  code={`<Badge variant="primary">Primary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>`}
                />
              </div>

              <div>
                <h4 className="font-semibold mb-3">Solid Badges</h4>
                <div className="flex flex-wrap gap-3 mb-4">
                  <Badge variant="solid-primary">Primary</Badge>
                  <Badge variant="solid-success">Success</Badge>
                  <Badge variant="solid-warning">Warning</Badge>
                  <Badge variant="solid-danger">Danger</Badge>
                  <Badge variant="solid-info">Info</Badge>
                </div>
                <CodeBlock
                  id="solid-badges"
                  code={`<Badge variant="solid-primary">Solid Primary</Badge>
<Badge variant="solid-success">Solid Success</Badge>`}
                />
              </div>

              <div>
                <h4 className="font-semibold mb-3">Status Badges (For Operations)</h4>
                <div className="flex flex-wrap gap-3 mb-4">
                  <StatusBadge status="online" />
                  <StatusBadge status="warning" />
                  <StatusBadge status="offline" />
                  <StatusBadge status="maintenance" />
                </div>
                <CodeBlock
                  id="status-badges"
                  code={`<StatusBadge status="online" />
<StatusBadge status="warning" />
<StatusBadge status="offline" />
<StatusBadge status="maintenance" />`}
                />
              </div>

              <div>
                <h4 className="font-semibold mb-3">Badge Features</h4>
                <div className="flex flex-wrap gap-3 mb-4">
                  <Badge variant="primary" dot>With Dot</Badge>
                  <Badge variant="success" leftIcon={<CheckCircle className="w-3 h-3" />}>With Icon</Badge>
                  <Badge variant="danger" removable onRemove={() => alert('Badge removed!')}>Removable</Badge>
                </div>
                <CodeBlock
                  id="badge-features"
                  code={`<Badge variant="primary" dot>With Dot</Badge>
<Badge variant="success" leftIcon={<CheckCircle className="w-3 h-3" />}>
  With Icon
</Badge>
<Badge variant="danger" removable onRemove={() => handleRemove()}>
  Removable
</Badge>`}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>XPRESS Color Palette</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Brand Colors</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="w-full h-20 bg-blue-600 rounded-lg mb-2"></div>
                    <p className="text-sm font-medium">XPRESS Primary</p>
                    <p className="text-xs text-gray-500">xpress-600</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Semantic Colors</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="w-full h-20 bg-green-600 rounded-lg mb-2"></div>
                    <p className="text-sm font-medium">Success</p>
                    <p className="text-xs text-gray-500">success-600</p>
                  </div>
                  <div className="text-center">
                    <div className="w-full h-20 bg-yellow-600 rounded-lg mb-2"></div>
                    <p className="text-sm font-medium">Warning</p>
                    <p className="text-xs text-gray-500">warning-600</p>
                  </div>
                  <div className="text-center">
                    <div className="w-full h-20 bg-red-600 rounded-lg mb-2"></div>
                    <p className="text-sm font-medium">Danger</p>
                    <p className="text-xs text-gray-500">danger-600</p>
                  </div>
                  <div className="text-center">
                    <div className="w-full h-20 bg-blue-500 rounded-lg mb-2"></div>
                    <p className="text-sm font-medium">Info</p>
                    <p className="text-xs text-gray-500">info-600</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Neutral Colors</h4>
                <div className="grid grid-cols-5 gap-2">
                  {[50, 100, 300, 600, 900].map((shade) => (
                    <div key={shade} className="text-center">
                      <div className={`w-full h-16 bg-gray-${shade} rounded-lg mb-2 ${shade > 500 ? 'border' : ''}`}></div>
                      <p className="text-xs">neutral-{shade}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Common UI Patterns</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Dashboard Card Pattern</h4>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">2,350</div>
                    <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                  </CardContent>
                </Card>
                <CodeBlock
                  id="dashboard-card"
                  code={`<Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
    <Users className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">2,350</div>
    <p className="text-xs text-muted-foreground">+20.1% from last month</p>
  </CardContent>
</Card>`}
                />
              </div>

              <div>
                <h4 className="font-semibold mb-3">Action Card Pattern</h4>
                <Card hover interactive className="cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-4">
                      <Shield className="h-8 w-8 text-blue-600" />
                      <div>
                        <h3 className="font-semibold">Security Settings</h3>
                        <p className="text-sm text-gray-600">Manage authentication and permissions</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <CodeBlock
                  id="action-card"
                  code={`<Card hover interactive className="cursor-pointer">
  <CardContent className="pt-6">
    <div className="flex items-center space-x-4">
      <Shield className="h-8 w-8 text-blue-600" />
      <div>
        <h3 className="font-semibold">Security Settings</h3>
        <p className="text-sm text-gray-600">Manage authentication and permissions</p>
      </div>
    </div>
  </CardContent>
</Card>`}
                />
              </div>

              <div>
                <h4 className="font-semibold mb-3">Status Display Pattern</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Database className="h-5 w-5 text-gray-500" />
                      <span className="font-medium">Database</span>
                    </div>
                    <StatusBadge status="online" />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-gray-500" />
                      <span className="font-medium">Security System</span>
                    </div>
                    <StatusBadge status="warning" />
                  </div>
                </div>
                <CodeBlock
                  id="status-display"
                  code={`<div className="flex items-center justify-between p-3 border rounded-lg">
  <div className="flex items-center space-x-3">
    <Database className="h-5 w-5 text-gray-500" />
    <span className="font-medium">Database</span>
  </div>
  <StatusBadge status="online" />
</div>`}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UIReferencePanel;