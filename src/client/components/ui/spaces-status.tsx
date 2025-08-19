import React from "react";
import { CheckCircle, AlertCircle, XCircle, Settings, ExternalLink } from "lucide-react";
import { Button } from "./button";
import { Badge } from "./badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { SpacesService } from "@/lib/spaces-service";

export function SpacesStatus() {
  const isConfigured = SpacesService.isConfigured();
  const configErrors = SpacesService.getConfigurationErrors();

  const getStatusIcon = () => {
    if (isConfigured) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (configErrors.length > 0) {
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusText = () => {
    if (isConfigured) {
      return "Configured";
    }
    if (configErrors.length > 0) {
      return "Partially Configured";
    }
    return "Not Configured";
  };

  const getStatusVariant = () => {
    if (isConfigured) {
      return "default";
    }
    if (configErrors.length > 0) {
      return "secondary";
    }
    return "destructive";
  };

  const openEnvFile = () => {
    // This would typically open the .env file in the user's editor
    // For now, we'll show instructions
    alert(
      "Please create a .env file in your project root with the following variables:\n\n" +
      "VITE_SPACES_ENDPOINT=https://your-region.digitaloceanspaces.com\n" +
      "VITE_SPACES_BUCKET=your-bucket-name\n" +
      "VITE_SPACES_ACCESS_KEY_ID=your-access-key-id\n" +
      "VITE_SPACES_SECRET_ACCESS_KEY=your-secret-access-key\n" +
      "VITE_SPACES_REGION=your-region"
    );
  };

  const openDigitalOceanDocs = () => {
    window.open("https://docs.digitalocean.com/products/spaces/", "_blank");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          DigitalOcean Spaces Status
        </CardTitle>
        <CardDescription>
          Check the configuration status of your file storage service
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">Status:</span>
            <Badge variant={getStatusVariant()}>
              {getStatusText()}
            </Badge>
          </div>
        </div>

        {/* Configuration Details */}
        {isConfigured ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              All required environment variables are configured
            </div>
            <p className="text-sm text-muted-foreground">
              Your file upload system is ready to use with DigitalOcean Spaces.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {configErrors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Configuration Issues:</h4>
                <ul className="space-y-1">
                  {configErrors.map((error, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-red-600">
                      <XCircle className="h-4 w-4" />
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Required Environment Variables:</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <code className="bg-muted px-2 py-1 rounded">VITE_SPACES_ENDPOINT</code>
                  <Badge variant="outline">Required</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <code className="bg-muted px-2 py-1 rounded">VITE_SPACES_BUCKET</code>
                  <Badge variant="outline">Required</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <code className="bg-muted px-2 py-1 rounded">VITE_SPACES_ACCESS_KEY_ID</code>
                  <Badge variant="outline">Required</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <code className="bg-muted px-2 py-1 rounded">VITE_SPACES_SECRET_ACCESS_KEY</code>
                  <Badge variant="outline">Required</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <code className="bg-muted px-2 py-1 rounded">VITE_SPACES_REGION</code>
                  <Badge variant="outline">Required</Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={openEnvFile}
            className="flex-1"
          >
            <Settings className="mr-2 h-4 w-4" />
            Setup Instructions
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={openDigitalOceanDocs}
            className="flex-1"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            DigitalOcean Docs
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-xs text-muted-foreground border-t pt-3">
          <p>
            <strong>Note:</strong> After updating your environment variables, restart your development server for changes to take effect.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
