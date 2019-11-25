import * as React from 'react';
import { UiAnalyzerService } from 'ui/services/ui-analyzer-service';

export const ServicesContext = React.createContext({
    analyzer: null as any as UiAnalyzerService
});