import React, { useEffect, useState } from 'react';
import { Alert, Button } from 'antd';
import { WarningOutlined, InfoCircleOutlined } from '@ant-design/icons';

/**
 * Component to check browser compatibility with WebGL and provide guidance
 * to users on optimizing their experience.
 */
const BrowserCompatCheck = ({ onCompatibilityChange }) => {
  const [compatibility, setCompatibility] = useState({
    webGLSupported: true,
    webGL2Supported: true,
    hardwareAcceleration: true,
    isMobile: false,
    isIE: false,
    warning: null,
    error: null
  });

  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkCompatibility();
  }, []);

  useEffect(() => {
    if (onCompatibilityChange) {
      onCompatibilityChange(compatibility);
    }
  }, [compatibility, onCompatibilityChange]);

  const checkCompatibility = () => {
    try {
      // Check for mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

      // Check for Internet Explorer
      const isIE = /MSIE|Trident/.test(navigator.userAgent);

      // Create a canvas element to test WebGL support
      const canvas = document.createElement('canvas');
      let webGLSupported = false;
      let webGL2Supported = false;
      let hardwareAcceleration = true;
      let warning = null;
      let error = null;

      // Check WebGL2 support
      let gl2 = canvas.getContext('webgl2');
      webGL2Supported = !!gl2;

      // Check WebGL support if WebGL2 is not available
      if (!webGL2Supported) {
        let gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        webGLSupported = !!gl;

        if (webGLSupported) {
          warning = 'Your browser supports WebGL but not WebGL2. You may experience reduced performance or visual quality.';
        }
      }

      // If no WebGL support at all
      if (!webGLSupported && !webGL2Supported) {
        error = 'WebGL is not supported by your browser. The 3D visualization will not work.';
      } else {
        // Check if hardware acceleration is enabled
        const gl = gl2 || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            // Check for software renderers
            if (
              renderer.includes('SwiftShader') ||
              renderer.includes('ANGLE') ||
              renderer.includes('llvmpipe') ||
              renderer.includes('Software') ||
              renderer.includes('Microsoft Basic Render')
            ) {
              hardwareAcceleration = false;
              warning = 'Hardware acceleration appears to be disabled. Performance of 3D visualizations will be reduced.';
            }
          }
        }
      }

      // Internet Explorer warning
      if (isIE) {
        error = 'Internet Explorer is not supported. Please use a modern browser like Chrome, Firefox, or Edge.';
      }

      // Set the compatibility state
      setCompatibility({
        webGLSupported: webGLSupported || webGL2Supported,
        webGL2Supported,
        hardwareAcceleration,
        isMobile,
        isIE,
        warning,
        error
      });
    } catch (e) {
      console.error('Error checking browser compatibility:', e);
      setCompatibility({
        webGLSupported: false,
        webGL2Supported: false,
        hardwareAcceleration: false,
        isMobile: false,
        isIE: false,
        warning: null,
        error: 'Could not check browser compatibility: ' + e.message
      });
    }
  };

  if (dismissed || (!compatibility.error && !compatibility.warning)) {
    return null;
  }

  return (
    <div className="mb-4">
      {compatibility.error && (
        <Alert
          message="Browser Compatibility Issue"
          description={
            <div>
              <p>{compatibility.error}</p>
              {compatibility.isIE && (
                <p>Internet Explorer is not supported. Please use a modern browser like Chrome, Firefox, or Edge.</p>
              )}
              {!compatibility.webGLSupported && (
                <p>
                  To enable WebGL:
                  <ul className="list-disc pl-5 mt-1">
                    <li>Update your browser to the latest version</li>
                    <li>Enable hardware acceleration in your browser settings</li>
                    <li>Update your graphics drivers</li>
                  </ul>
                </p>
              )}
            </div>
          }
          type="error"
          showIcon
          icon={<WarningOutlined />}
          closable
          onClose={() => setDismissed(true)}
        />
      )}

      {!compatibility.error && compatibility.warning && (
        <Alert
          message="Browser Performance Warning"
          description={
            <div>
              <p>{compatibility.warning}</p>
              {!compatibility.hardwareAcceleration && (
                <p>
                  To enable hardware acceleration:
                  <ul className="list-disc pl-5 mt-1">
                    <li>Chrome: Go to Settings → Advanced → System → Use hardware acceleration when available</li>
                    <li>Firefox: Go to Settings → Performance → Uncheck "Use recommended performance settings" and check "Use hardware acceleration when available"</li>
                    <li>Edge: Go to Settings → System and performance → Use hardware acceleration when available</li>
                  </ul>
                </p>
              )}
              {compatibility.isMobile && (
                <p>The 3D visualization may be slower on mobile devices. Consider using a desktop computer for the best experience.</p>
              )}
            </div>
          }
          type="warning"
          showIcon
          icon={<InfoCircleOutlined />}
          closable
          onClose={() => setDismissed(true)}
        />
      )}
    </div>
  );
};

export default BrowserCompatCheck; 