import './App.css';
import Turbine from './components/Turbine'
import EnvisionLogo from './components/EnvisionLogo'
import StatisticsPanel from './components/StatisticsPanel'
import Histogram from '../src/components/Echarts/Histogram'

function App() {
    return (
        <div className="App">
            <EnvisionLogo className="envisionlogo"/>
            <StatisticsPanel className="statistical"/>
            <Histogram/>
            <Turbine className="turbine"/>

        </div>
    );
}

export default App;
