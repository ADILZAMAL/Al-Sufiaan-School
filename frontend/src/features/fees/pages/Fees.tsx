import Header from "../../../components/layout/Navbar";
import Footer from "../../../components/layout/Footer";

function createData(className: string, fee: number) {
    return { className, fee };
}

const schoolFees = [
    createData("Nursery", 700),
    createData("Prep", 700),
    createData("One", 750),
    createData("Two", 800),
    createData("Three", 850),
    createData("Four", 900),
    createData("Five", 950),
    createData("Six", 1000),
    createData("Seven", 1100),
    createData("Eight", 1200),
];

const hostelFees = [
    createData("Nursery", 3700),
    createData("Prep", 3700),
    createData("One", 3750),
    createData("Two", 3800),
    createData("Three", 3850),
    createData("Four", 3900),
    createData("Five", 3950),
    createData("Six", 4000),
    createData("Seven", 4100),
    createData("Eight", 4200),
];

const dayBoardingFees = [
    createData("Nursery", 1850),
    createData("Prep", 1850),
    createData("One", 1900),
    createData("Two", 1950),
    createData("Three", 2000),
    createData("Four", 2050),
    createData("Five", 2100),
    createData("Six", 2150),
    createData("Seven", 2250),
    createData("Eight", 2350),
];

const dayBoardingWithLunchFees = [
    createData("Nursery", 2250),
    createData("Prep", 2250),
    createData("One", 2300),
    createData("Two", 2350),
    createData("Three", 2400),
    createData("Four", 2450),
    createData("Five", 2500),
    createData("Six", 2550),
    createData("Seven", 2650),
    createData("Eight", 2750),
];

const Class = () => {
    return (
        <>
            <Header />
            <div className="bg-blue-950">
                <div className="container grid gap-4 grid-cols-1 md:grid-cols-2">
                    <div className="px-4 py-8 sm:px-8">
                        <table className="border-collapse w-full border border-slate-400">
                            <caption className="caption-top font-semibold text-center text-slate-300">
                                School Fee Structure
                            </caption>
                            <thead className="bg-slate-700">
                                <tr>
                                    <th className="w-1/2 border border-slate-600 font-semibold p-4 text-slate-200 text-left">Class</th>
                                    <th className="w-1/2 border border-slate-600 font-semibold p-4 text-slate-200 text-left">Fees</th>
                                </tr>
                            </thead>
                            <tbody className="bg-slate-800">
                                {schoolFees.map(fee => (
                                    <tr>
                                        <td className="border border-slate-700 p-4 text-slate-300">{fee.className}</td>
                                        <td className="border border-slate-700 p-4 text-slate-300">{fee.fee}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-4 py-8 sm:px-8">
                        <table className="border-collapse w-full border border-slate-400">
                            <caption className="caption-top font-semibold text-center text-slate-300">
                                Hostel Fee Structure Including School Fee
                            </caption>
                            <thead className="bg-slate-700">
                                <tr>
                                    <th className="w-1/2 border border-slate-600 font-semibold p-4 text-slate-200 text-left">Class</th>
                                    <th className="w-1/2 border border-slate-600 font-semibold p-4 text-slate-200 text-left">Fees</th>
                                </tr>
                            </thead>
                            <tbody className="bg-slate-800">
                                {hostelFees.map(fee => (
                                    <tr>
                                        <td className="border border-slate-700 p-4 text-slate-300">{fee.className}</td>
                                        <td className="border border-slate-700 p-4 text-slate-300">{fee.fee}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-4 py-8 sm:px-8">
                        <table className="border-collapse w-full border border-slate-400">
                            <caption className="caption-top font-semibold text-center text-slate-300">
                                Day boarding + School Fee + Snacks
                            </caption>
                            <thead className="bg-slate-700">
                                <tr>
                                    <th className="w-1/2 border border-slate-600 font-semibold p-4 text-slate-200 text-left">Class</th>
                                    <th className="w-1/2 border border-slate-600 font-semibold p-4 text-slate-200 text-left">Fees</th>
                                </tr>
                            </thead>
                            <tbody className="bg-slate-800">
                                {dayBoardingFees.map(fee => (
                                    <tr>
                                        <td className="border border-slate-700 p-4 text-slate-300">{fee.className}</td>
                                        <td className="border border-slate-700 p-4 text-slate-300">{fee.fee}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-4 py-8 sm:px-8">
                        <table className="border-collapse w-full border border-slate-400">
                            <caption className="caption-top font-semibold text-center text-slate-300">
                                Day boarding + School Fee + Lunch + Snacks
                            </caption>
                            <thead className="bg-slate-700">
                                <tr>
                                    <th className="w-1/2 border border-slate-600 font-semibold p-4 text-slate-200 text-left">Class</th>
                                    <th className="w-1/2 border border-slate-600 font-semibold p-4 text-slate-200 text-left">Fees</th>
                                </tr>
                            </thead>
                            <tbody className="bg-slate-800">
                                {dayBoardingWithLunchFees.map(fee => (
                                    <tr>
                                        <td className="border border-slate-700 p-4 text-slate-300">{fee.className}</td>
                                        <td className="border border-slate-700 p-4 text-slate-300">{fee.fee}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default Class;
