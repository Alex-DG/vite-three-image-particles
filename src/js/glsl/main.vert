uniform float uPointSize;
uniform float uTime;
uniform float uProgress;
uniform float uFrequency;
uniform float uAmplitude;

attribute vec3 initPosition;

varying vec2 vTexCoords;

void main() {
	#include <begin_vertex>

  transformed = initPosition + ((position - initPosition) * uProgress);

  transformed.z += sin(transformed.x * uFrequency + uTime) * uAmplitude;
  transformed.z += sin(transformed.y * uFrequency + uTime) * uAmplitude;

	#include <project_vertex>

	gl_PointSize = uPointSize;

  vTexCoords = position.xy;
}
