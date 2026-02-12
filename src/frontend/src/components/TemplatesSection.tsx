import { useState } from 'react';
import { useGetMessageTemplatesByCategory, useSaveMessageTemplate, useGetDefaultFollowUpTemplate, useSetDefaultFollowUpTemplate, useIsCallerAdmin } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Plus, Loader2, Copy, Check, Star, Info } from 'lucide-react';
import { TemplateCategory } from '../backend';
import type { MessageTemplate } from '../backend';
import { toast } from 'sonner';

const templateCategoryLabels: Record<TemplateCategory, string> = {
  [TemplateCategory.followUp]: 'Follow-up',
  [TemplateCategory.support]: 'Support',
  [TemplateCategory.sales]: 'Sales',
  [TemplateCategory.general]: 'General',
};

const templateCategoryColors: Record<TemplateCategory, string> = {
  [TemplateCategory.followUp]: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  [TemplateCategory.support]: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  [TemplateCategory.sales]: 'bg-green-500/10 text-green-700 dark:text-green-400',
  [TemplateCategory.general]: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
};

export default function TemplatesSection() {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>(TemplateCategory.general);
  const { data: templates = [], isLoading } = useGetMessageTemplatesByCategory(selectedCategory);
  const { data: defaultTemplate } = useGetDefaultFollowUpTemplate();
  const { data: isAdmin = false } = useIsCallerAdmin();
  const saveTemplate = useSaveMessageTemplate();
  const setDefaultTemplate = useSetDefaultFollowUpTemplate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: TemplateCategory.general,
    content: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim()) return;

    const template: MessageTemplate = {
      id: BigInt(0),
      category: formData.category,
      content: formData.content.trim(),
      createdAt: BigInt(Date.now() * 1000000),
    };

    saveTemplate.mutate(template, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setFormData({ category: TemplateCategory.general, content: '' });
      },
    });
  };

  const handleCopyTemplate = (content: string, templateId: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(templateId);
    toast.success('Template copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSetAsDefault = (template: MessageTemplate) => {
    setDefaultTemplate.mutate(template.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Message Templates</h2>
          <p className="text-muted-foreground">Manage quick reply templates for common messages</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Message Template</DialogTitle>
              <DialogDescription>Create a reusable message template</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as TemplateCategory })}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(templateCategoryLabels).map(([category, label]) => (
                      <SelectItem key={category} value={category}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Message Content *</Label>
                <Textarea
                  id="content"
                  placeholder="Enter your template message"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveTemplate.isPending || !formData.content.trim()}>
                  {saveTemplate.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Create Template'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {selectedCategory === TemplateCategory.followUp && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Default Follow-up Template</AlertTitle>
          <AlertDescription>
            The default follow-up template will be automatically used when scheduling follow-ups. Click the star icon to set a template as default.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2 flex-wrap">
        {Object.entries(templateCategoryLabels).map(([category, label]) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(category as TemplateCategory)}
          >
            {label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 w-full bg-muted animate-pulse rounded" />
                  <div className="h-3 w-5/6 bg-muted animate-pulse rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-center">
              No templates found for this category.
              <br />
              Create your first template to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => {
            const isCopied = copiedId === template.id.toString();
            const isDefault = defaultTemplate?.id === template.id;
            return (
              <Card key={template.id.toString()} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <Badge className={templateCategoryColors[template.category]}>
                      {templateCategoryLabels[template.category]}
                    </Badge>
                    <div className="flex gap-1">
                      {selectedCategory === TemplateCategory.followUp && isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleSetAsDefault(template)}
                          disabled={setDefaultTemplate.isPending}
                        >
                          <Star
                            className={`h-4 w-4 ${isDefault ? 'fill-yellow-500 text-yellow-500' : ''}`}
                          />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleCopyTemplate(template.content, template.id.toString())}
                      >
                        {isCopied ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                    {template.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-3">
                    Created: {new Date(Number(template.createdAt) / 1000000).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
