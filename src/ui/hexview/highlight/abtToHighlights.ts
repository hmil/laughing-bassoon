import { Highlight } from './Highlight';
import { AbtUITree } from 'ui/services/UIPresentationService';

export class HighlghtColorState {
    h: number = 0;

    newColor(): string {
        this.h = this.h + 0.05;
        if (this.h >= 1) {
            this.h -= 1;
        }
        return this.hslToRgb(this.h, 1, 0.5);
    }

    private hslToRgb(h: number, s: number, l: number){
        var r, g, b;
    
        if(s == 0) {
            r = g = b = l; // achromatic
        } else {
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = this.hue2rgb(p, q, h + 1/3);
            g = this.hue2rgb(p, q, h);
            b = this.hue2rgb(p, q, h - 1/3);
        }
    
        return `${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}`;
    }

    private hue2rgb(p: number, q: number, t: number){
        if(t < 0) t += 1;
        if(t > 1) t -= 1;
        if(t < 1/6) return p + (q - p) * 6 * t;
        if(t < 1/2) return q;
        if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    }
    
}

export function abtToHighlights(abt: AbtUITree, state = new HighlghtColorState()): Highlight[] {

    const children = abt.children;
    if (children === undefined) {
        return [];
    }
    return children.map<Highlight[]>(c => [
        {
            color: state.newColor(),
            start: c.node.start,
            end: c.node.end,
            nodeId: c.node.id,
            hovered: c.hovered
        },
        ...abtToHighlights(c)
    ]).reduce((acc, curr) => acc.concat(curr), []);
}
