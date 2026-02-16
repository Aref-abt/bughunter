const { createCanvas, loadImage } = require('canvas');

class ScreenshotAnnotator {
  async annotate(screenshotBase64, annotations) {
    try {
      // Convert base64 to buffer
      const imageBuffer = Buffer.from(screenshotBase64, 'base64');
      
      // Load image
      const image = await loadImage(imageBuffer);
      
      // Create canvas
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext('2d');
      
      // Draw original image
      ctx.drawImage(image, 0, 0);
      
      // Apply annotations
      for (const annotation of annotations) {
        if (annotation.type === 'circle') {
          this.drawCircle(ctx, annotation);
        } else if (annotation.type === 'arrow') {
          this.drawArrow(ctx, annotation);
        } else if (annotation.type === 'text') {
          this.drawText(ctx, annotation);
        } else if (annotation.type === 'highlight') {
          this.drawHighlight(ctx, annotation);
        }
      }
      
      // Convert back to base64
      const buffer = canvas.toBuffer('image/png');
      return buffer.toString('base64');
      
    } catch (error) {
      console.error('❌ Annotation error:', error);
      // Return original screenshot if annotation fails
      return screenshotBase64;
    }
  }

  drawCircle(ctx, annotation) {
    const { x, y, radius = 50, color = '#FF0000', lineWidth = 5 } = annotation;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawArrow(ctx, annotation) {
    const { fromX, fromY, toX, toY, color = '#FF0000', lineWidth = 4 } = annotation;
    
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    
    // Draw arrowhead
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const arrowSize = 15;
    
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - arrowSize * Math.cos(angle - Math.PI / 6),
      toY - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - arrowSize * Math.cos(angle + Math.PI / 6),
      toY - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  }

  drawText(ctx, annotation) {
    const { 
      x, 
      y, 
      text, 
      fontSize = 24, 
      color = '#FF0000', 
      backgroundColor = 'rgba(255, 255, 255, 0.9)',
      padding = 10
    } = annotation;
    
    ctx.font = `bold ${fontSize}px Arial`;
    
    // Measure text
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = fontSize;
    
    // Draw background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(
      x - padding, 
      y - textHeight - padding,
      textWidth + padding * 2,
      textHeight + padding * 2
    );
    
    // Draw border
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(
      x - padding,
      y - textHeight - padding,
      textWidth + padding * 2,
      textHeight + padding * 2
    );
    
    // Draw text
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  drawHighlight(ctx, annotation) {
    const { x, y, width, height, color = 'rgba(255, 0, 0, 0.3)' } = annotation;
    
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    
    // Draw border
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);
  }

  async createBugAnnotation(screenshotBase64, bugLocation) {
    // Create standard bug annotation
    const annotations = [
      {
        type: 'circle',
        x: bugLocation.x || 100,
        y: bugLocation.y || 100,
        radius: 60,
        color: '#FF0000'
      },
      {
        type: 'arrow',
        fromX: bugLocation.x + 100 || 200,
        fromY: bugLocation.y - 100 || 0,
        toX: bugLocation.x + 10 || 110,
        toY: bugLocation.y - 10 || 90,
        color: '#FF0000'
      },
      {
        type: 'text',
        x: bugLocation.x + 120 || 220,
        y: bugLocation.y - 80 || 20,
        text: '⚠️ BUG DETECTED',
        color: '#FF0000'
      }
    ];
    
    return await this.annotate(screenshotBase64, annotations);
  }
}

module.exports = ScreenshotAnnotator;
