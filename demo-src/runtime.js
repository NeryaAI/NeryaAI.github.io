// Import the actual bundled Agent before installing only missing local fixture
// contracts. React's first render/effects run after this module initializes.
import './app.js?build=20261106-review';
import { installNativeFixtures } from './native-fixtures.js';
installNativeFixtures();
